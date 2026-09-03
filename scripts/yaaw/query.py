"""Read-only query helpers for workflow state, ownership and artifact contracts."""
from __future__ import annotations

import json
from pathlib import Path

from .graph import TicketGraph
from .model import Ticket
from .ownership import OwnershipRule


def ticket_or_error(graph: TicketGraph, ticket_id: str) -> Ticket:
    try:
        return graph.tickets[ticket_id]
    except KeyError as exc:
        raise KeyError(f"unknown ticket id {ticket_id!r}") from exc


def load_ownership_rules(path: Path) -> tuple[list[OwnershipRule], str]:
    data = json.loads(path.read_text(encoding="utf-8"))
    rules: list[OwnershipRule] = []
    for entry in data.get("entries", []):
        co = entry.get("co_owners")
        if co is None and entry.get("co_owner"):
            co = [entry["co_owner"]]
        rules.append(OwnershipRule(
            pattern=str(entry["pattern"]),
            owner=str(entry["owner"]),
            co_owners=tuple(str(v) for v in (co or [])),
            deny=bool(entry.get("deny", False)),
            source=str(entry.get("source", "core")),
        ))
    return rules, str(data.get("default_owner", "UNKNOWN_OWNER"))


def artifact_contract(path: Path, artifact_id: str) -> dict:
    data = json.loads(path.read_text(encoding="utf-8"))
    for item in data.get("artifact_types", []):
        if item.get("id") == artifact_id:
            return dict(item)
    raise KeyError(f"unknown artifact id {artifact_id!r}")
