#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path

from yaaw.artifacts import validate_ticket_tree
from yaaw.graph import TicketGraph


def main() -> int:
    root = Path("tickets")
    errors = validate_ticket_tree(root)
    graph = TicketGraph.from_directory(root)
    diagnostics = graph.diagnostics()
    errors.extend(f"missing blocker: {item}" for item in diagnostics.missing_blockers)
    errors.extend("cycle: " + " -> ".join(cycle + (cycle[0],)) for cycle in diagnostics.cycles)
    errors.extend(f"impossible READY: {item}" for item in diagnostics.impossible_ready)
    if errors:
        print("Workflow state validation failed:")
        for error in sorted(set(errors)):
            print(f"  - {error}")
        return 2
    print(f"OK: workflow state valid ({len(graph.tickets)} structured ticket(s))")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
