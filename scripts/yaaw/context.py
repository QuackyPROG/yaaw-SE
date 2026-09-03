"""Generate bounded structured child-agent context capsules from ticket state."""
from __future__ import annotations

import json
from dataclasses import dataclass

from .model import Ticket


@dataclass(frozen=True)
class ContextCapsule:
    payload: dict

    def render(self, max_chars: int = 16000) -> str:
        text = json.dumps(self.payload, indent=2, sort_keys=True)
        if len(text) > max_chars:
            raise ValueError(f"context capsule exceeds {max_chars} characters; link sources instead of copying them")
        return text


def from_ticket(ticket: Ticket, role: str, verification: list[str] | None = None, invariants: list[str] | None = None, stop_triggers: list[str] | None = None) -> ContextCapsule:
    meta = ticket.metadata
    payload = {
        "schema": "yaaw.handoff/v1",
        "role": role,
        "work_id": ticket.id,
        "goal": meta.get("goal") or meta.get("title") or ticket.id,
        "acceptance": list(ticket.acceptance),
        "sources": sorted(ticket.source_fingerprints),
        "source_fingerprints": dict(ticket.source_fingerprints),
        "allowed_write": list(meta.get("allowed_write", [])),
        "forbidden_write": list(meta.get("forbidden_write", [])),
        "expected_change_surface": list(meta.get("expected_change_surface", [])),
        "preservation_invariants": list(invariants or meta.get("preservation_invariants", [])),
        "verification": list(verification or meta.get("verification", [])),
        "stop_triggers": list(stop_triggers or meta.get("stop_triggers", [])),
        "expected_return": ["structured role result", "changed/evidence paths", "verification provenance", "remaining risks"],
    }
    return ContextCapsule(payload)
