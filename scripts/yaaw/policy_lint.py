"""Deterministic policy lint for obviously unsafe or contradictory workflow configuration."""
from __future__ import annotations

import json
from pathlib import Path

from .artifacts import validate_ticket_tree
from .graph import TicketGraph
from .ownership import validate_rules
from .query import load_ownership_rules


BROAD_WRITE_PATTERNS = {"**", "*", "./**", "../**", "/"}


def lint_repository_policy(ownership_path: Path, artifacts_path: Path, tickets_root: Path) -> list[str]:
    errors: list[str] = []
    rules, _ = load_ownership_rules(ownership_path)
    errors.extend(validate_rules(rules))

    artifacts = json.loads(artifacts_path.read_text(encoding="utf-8"))
    ids = [a.get("id") for a in artifacts.get("artifact_types", [])]
    duplicates = sorted({value for value in ids if value and ids.count(value) > 1})
    errors.extend(f"duplicate artifact id {value}" for value in duplicates)

    if tickets_root.exists():
        errors.extend(validate_ticket_tree(tickets_root))
        graph = TicketGraph.from_directory(tickets_root)
        diagnostics = graph.diagnostics()
        errors.extend(f"missing blocker {x}" for x in diagnostics.missing_blockers)
        errors.extend(f"cycle {' -> '.join(c)}" for c in diagnostics.cycles)
        for ticket in graph.tickets.values():
            allowed = ticket.metadata.get("allowed_write", [])
            if ticket.kind.value == "DELIVERY" and any(str(v).strip() in BROAD_WRITE_PATTERNS for v in allowed):
                errors.append(f"{ticket.id}: dangerously broad allowed_write")
            if ticket.status.value == "READY" and ticket.owner == "UNKNOWN_OWNER":
                errors.append(f"{ticket.id}: READY with UNKNOWN_OWNER")
            if ticket.status.value == "READY" and not ticket.acceptance:
                errors.append(f"{ticket.id}: READY without machine acceptance")
    return sorted(set(errors))
