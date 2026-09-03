"""Explicit approval records for human-authority transitions and policy exceptions."""
from __future__ import annotations

from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from pathlib import Path
import json


class ApprovalError(PermissionError):
    pass


@dataclass(frozen=True)
class ApprovalRecord:
    authority: str
    action: str
    target: str
    reference: str
    timestamp: str
    expires_at: str | None = None

    @classmethod
    def create(cls, authority: str, action: str, target: str, reference: str, expires_at: str | None = None) -> "ApprovalRecord":
        if not reference.strip():
            raise ValueError("approval reference must identify the explicit authority event")
        return cls(authority, action, target, reference, datetime.now(timezone.utc).isoformat(), expires_at)


def append_approval(path: Path, record: ApprovalRecord) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("a", encoding="utf-8") as fh:
        fh.write(json.dumps(asdict(record), sort_keys=True) + "\n")


def require_approval(records: list[ApprovalRecord], authority: str, action: str, target: str) -> ApprovalRecord:
    for record in reversed(records):
        if record.authority == authority and record.action == action and record.target == target:
            return record
    raise ApprovalError(f"missing {authority} approval for {action} on {target}")
