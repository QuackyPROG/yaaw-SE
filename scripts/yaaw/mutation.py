"""Atomic/idempotent mutations for durable yaaw-SE workflow state."""
from __future__ import annotations

import hashlib
import json
import os
import tempfile
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any

from .frontmatter import dump, parse
from .model import Ticket, TicketState
from .state import TransitionContext, validate_transition


class MutationError(RuntimeError):
    pass


def _atomic_write(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp_name = tempfile.mkstemp(prefix=path.name + ".", dir=path.parent)
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as fh:
            fh.write(text)
            fh.flush()
            os.fsync(fh.fileno())
        os.replace(tmp_name, path)
    finally:
        if os.path.exists(tmp_name):
            os.unlink(tmp_name)


def _fingerprint(payload: dict[str, Any]) -> str:
    raw = json.dumps(payload, sort_keys=True, separators=(",", ":")).encode("utf-8")
    return hashlib.sha256(raw).hexdigest()


@dataclass(frozen=True)
class OperationRecord:
    operation_id: str
    fingerprint: str
    status: str
    result: dict[str, Any] | None = None


class IdempotencyStore:
    """Small atomic journal for retry-safe controller mutations."""

    def __init__(self, path: Path):
        self.path = path

    def _load(self) -> dict[str, dict[str, Any]]:
        if not self.path.exists():
            return {}
        data = json.loads(self.path.read_text(encoding="utf-8"))
        if not isinstance(data, dict):
            raise MutationError("idempotency store must contain an object")
        return data

    def _save(self, data: dict[str, dict[str, Any]]) -> None:
        _atomic_write(self.path, json.dumps(data, indent=2, sort_keys=True) + "\n")

    def prepare(self, operation_id: str, payload: dict[str, Any]) -> OperationRecord:
        if not operation_id.strip():
            raise MutationError("mutating operation requires a non-empty operation id")
        fingerprint = _fingerprint(payload)
        data = self._load()
        existing = data.get(operation_id)
        if existing is not None:
            if existing.get("fingerprint") != fingerprint:
                raise MutationError(f"operation id {operation_id!r} was already used for a different mutation")
            return OperationRecord(operation_id, fingerprint, str(existing.get("status", "PENDING")), existing.get("result"))
        data[operation_id] = {"fingerprint": fingerprint, "status": "PENDING", "result": None}
        self._save(data)
        return OperationRecord(operation_id, fingerprint, "PENDING", None)

    def complete(self, operation_id: str, result: dict[str, Any]) -> OperationRecord:
        data = self._load()
        existing = data.get(operation_id)
        if existing is None:
            raise MutationError(f"operation id {operation_id!r} was not prepared")
        existing["status"] = "COMPLETED"
        existing["result"] = dict(result)
        self._save(data)
        return OperationRecord(operation_id, str(existing["fingerprint"]), "COMPLETED", dict(result))


def transition_ticket(path: Path, target: TicketState, ctx: TransitionContext, *, operation_id: str | None = None, store: IdempotencyStore | None = None, write: bool = False) -> dict[str, Any]:
    """Validate a transition; with write=True apply it atomically and retry-safely."""
    text = path.read_text(encoding="utf-8")
    ticket = Ticket.from_markdown(text, path)
    payload = {"kind": "TICKET_TRANSITION", "path": path.as_posix(), "ticket_id": ticket.id, "target": target.value, "context": asdict(ctx)}

    if not write:
        if ticket.status is not target:
            validate_transition(ticket, target, ctx)
        return {"ticket": ticket.id, "from": ticket.status.value, "to": target.value, "changed": ticket.status is not target, "dry_run": True}

    if store is None or operation_id is None:
        raise MutationError("write transition requires idempotency store and operation id")

    record = store.prepare(operation_id, payload)
    if record.status == "COMPLETED":
        return dict(record.result or {})

    current_text = path.read_text(encoding="utf-8")
    current_doc = parse(current_text)
    current = Ticket.from_markdown(current_text, path)
    if current.status is target:
        result = {"ticket": current.id, "from": target.value, "to": target.value, "changed": False, "recovered_pending_operation": True}
        store.complete(operation_id, result)
        return result

    validate_transition(current, target, ctx)
    metadata = dict(current_doc.metadata)
    metadata["status"] = target.value
    _atomic_write(path, dump(metadata, current_doc.body))
    result = {"ticket": current.id, "from": current.status.value, "to": target.value, "changed": True, "recovered_pending_operation": False}
    store.complete(operation_id, result)
    return result
