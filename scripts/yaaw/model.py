"""Core typed workflow state for yaaw-SE."""
from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from pathlib import Path
from typing import Any, Mapping

from .frontmatter import parse


class TicketKind(str, Enum):
    DISCOVERY = "DISCOVERY"
    DECISION = "DECISION"
    DELIVERY = "DELIVERY"


class TicketState(str, Enum):
    DRAFT = "DRAFT"
    BLOCKED = "BLOCKED"
    READY = "READY"
    IN_PROGRESS = "IN_PROGRESS"
    VERIFYING = "VERIFYING"
    DONE = "DONE"
    SUPERSEDED = "SUPERSEDED"
    CANCELLED = "CANCELLED"


TERMINAL_STATES = {TicketState.DONE, TicketState.SUPERSEDED, TicketState.CANCELLED}

ALLOWED_TRANSITIONS: Mapping[TicketState, frozenset[TicketState]] = {
    TicketState.DRAFT: frozenset({TicketState.BLOCKED, TicketState.READY, TicketState.SUPERSEDED, TicketState.CANCELLED}),
    TicketState.BLOCKED: frozenset({TicketState.DRAFT, TicketState.READY, TicketState.SUPERSEDED, TicketState.CANCELLED}),
    TicketState.READY: frozenset({TicketState.BLOCKED, TicketState.IN_PROGRESS, TicketState.SUPERSEDED, TicketState.CANCELLED}),
    TicketState.IN_PROGRESS: frozenset({TicketState.BLOCKED, TicketState.VERIFYING, TicketState.SUPERSEDED, TicketState.CANCELLED}),
    TicketState.VERIFYING: frozenset({TicketState.BLOCKED, TicketState.IN_PROGRESS, TicketState.DONE, TicketState.SUPERSEDED, TicketState.CANCELLED}),
    TicketState.DONE: frozenset(),
    TicketState.SUPERSEDED: frozenset(),
    TicketState.CANCELLED: frozenset(),
}


@dataclass(frozen=True)
class Ticket:
    id: str
    kind: TicketKind
    status: TicketState
    level: int
    owner: str
    blocked_by: tuple[str, ...] = ()
    qa_required: bool = False
    acceptance: tuple[str, ...] = ()
    source_fingerprints: Mapping[str, str] = field(default_factory=dict)
    metadata: Mapping[str, Any] = field(default_factory=dict, repr=False)
    path: Path | None = None

    @classmethod
    def from_markdown(cls, text: str, path: Path | None = None) -> "Ticket":
        meta = parse(text).metadata
        try:
            kind = TicketKind(meta["kind"])
            status = TicketState(meta["status"])
            level = int(meta["level"])
            ticket_id = str(meta["id"])
            owner = str(meta.get("owner", "UNKNOWN_OWNER"))
        except (KeyError, ValueError, TypeError) as exc:
            raise ValueError(f"invalid ticket metadata in {path or '<memory>'}: {exc}") from exc
        if not 0 <= level <= 4:
            raise ValueError(f"ticket {ticket_id}: level must be 0..4")
        blocked = tuple(str(v) for v in meta.get("blocked_by", []))
        acceptance = tuple(str(v) for v in meta.get("acceptance", []))
        qa = meta.get("qa", {})
        qa_required = bool(qa.get("required", False)) if isinstance(qa, dict) else bool(qa)
        fingerprints = meta.get("source_fingerprints", {})
        if not isinstance(fingerprints, dict):
            raise ValueError(f"ticket {ticket_id}: source_fingerprints must be an object")
        return cls(
            id=ticket_id,
            kind=kind,
            status=status,
            level=level,
            owner=owner,
            blocked_by=blocked,
            qa_required=qa_required,
            acceptance=acceptance,
            source_fingerprints={str(k): str(v) for k, v in fingerprints.items()},
            metadata=meta,
            path=path,
        )
