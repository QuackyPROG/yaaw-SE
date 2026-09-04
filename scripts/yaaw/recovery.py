"""Atomic ephemeral controller snapshots and repository-state reconstruction."""
from __future__ import annotations

import json
import os
import tempfile
from dataclasses import asdict, dataclass
from pathlib import Path

from .graph import TicketGraph
from .model import TicketState


@dataclass
class RuntimeSnapshot:
    active_work: str | None
    active_role: str | None
    worktree: str | None
    base_sha: str | None
    dispatch_attempt: int = 0
    failure_signatures: dict[str, int] | None = None


@dataclass(frozen=True)
class ResumeState:
    active_work: str | None
    active_role: str | None
    worktree: str | None
    base_sha: str | None
    dispatch_attempt: int
    failure_signatures: dict[str, int]
    source: str


class SnapshotStore:
    def __init__(self, path: Path):
        self.path = path

    def save(self, snapshot: RuntimeSnapshot) -> None:
        self.path.parent.mkdir(parents=True, exist_ok=True)
        fd, tmp_name = tempfile.mkstemp(prefix=self.path.name, dir=self.path.parent)
        try:
            with os.fdopen(fd, "w", encoding="utf-8") as fh:
                json.dump(asdict(snapshot), fh, indent=2, sort_keys=True)
                fh.write("\n")
                fh.flush()
                os.fsync(fh.fileno())
            os.replace(tmp_name, self.path)
        finally:
            if os.path.exists(tmp_name):
                os.unlink(tmp_name)

    def load(self) -> RuntimeSnapshot | None:
        if not self.path.exists():
            return None
        return RuntimeSnapshot(**json.loads(self.path.read_text(encoding="utf-8")))

    def clear(self) -> None:
        self.path.unlink(missing_ok=True)

    def register_failure(self, signature: str, limit: int) -> int:
        snapshot = self.load() or RuntimeSnapshot(None, None, None, None, 0, {})
        counts = dict(snapshot.failure_signatures or {})
        count = counts.get(signature, 0) + 1
        counts[signature] = count
        snapshot.failure_signatures = counts
        self.save(snapshot)
        if count > limit:
            raise RuntimeError(f"failure signature repeated {count} times; STOP_AND_REPLAN required: {signature}")
        return count


def reconstruct_state(graph: TicketGraph, snapshot: RuntimeSnapshot | None) -> ResumeState:
    active = sorted((ticket for ticket in graph.tickets.values() if ticket.status in {TicketState.IN_PROGRESS, TicketState.VERIFYING}), key=lambda ticket: ticket.id)
    if snapshot is not None and snapshot.active_work:
        ticket = graph.tickets.get(snapshot.active_work)
        if ticket is None:
            raise RuntimeError(f"snapshot references unknown ticket {snapshot.active_work}")
        if ticket.status not in {TicketState.IN_PROGRESS, TicketState.VERIFYING}:
            raise RuntimeError(f"snapshot ticket {ticket.id} is {ticket.status.value}, not active; reconcile durable state first")
        others = [item.id for item in active if item.id != ticket.id]
        if others:
            raise RuntimeError(f"snapshot active work {ticket.id} conflicts with other active tickets: {', '.join(others)}")
        return ResumeState(ticket.id, snapshot.active_role, snapshot.worktree, snapshot.base_sha, snapshot.dispatch_attempt, dict(snapshot.failure_signatures or {}), "SNAPSHOT+REPOSITORY")
    if len(active) > 1:
        raise RuntimeError("multiple active tickets require explicit reconciliation: " + ", ".join(ticket.id for ticket in active))
    if len(active) == 1:
        return ResumeState(active[0].id, None, None, None, 0, {}, "REPOSITORY")
    return ResumeState(None, None, None, None, 0, {}, "REPOSITORY")
