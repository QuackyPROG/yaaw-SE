"""Small dependency-free CLI for deterministic workflow inspection."""
from __future__ import annotations

import argparse
import json
from pathlib import Path

from .graph import TicketGraph


def _graph(args: argparse.Namespace) -> TicketGraph:
    return TicketGraph.from_directory(Path(args.tickets))


def cmd_validate(args: argparse.Namespace) -> int:
    graph = _graph(args)
    d = graph.diagnostics()
    if d.ok:
        print(f"OK: {len(graph.tickets)} structured tickets")
        return 0
    for item in d.missing_blockers:
        print(f"ERROR missing blocker: {item}")
    for cycle in d.cycles:
        print("ERROR cycle: " + " -> ".join(cycle + (cycle[0],)))
    for item in d.impossible_ready:
        print(f"ERROR impossible READY: {item}")
    return 1


def cmd_frontier(args: argparse.Namespace) -> int:
    graph = _graph(args)
    frontier = graph.ready_frontier()
    if frontier:
        for ticket in frontier:
            print(f"{ticket.id}\t{ticket.kind.value}\tL{ticket.level}\t{ticket.owner}")
        return 0
    unfinished = graph.unfinished()
    if unfinished:
        print("FRONTIER EMPTY")
        for reason in graph.deadlock_reasons():
            print(f"- {reason}")
        return 2
    print("No unfinished structured tickets")
    return 0


def cmd_status(args: argparse.Namespace) -> int:
    graph = _graph(args)
    counts: dict[str, int] = {}
    for ticket in graph.tickets.values():
        counts[ticket.status.value] = counts.get(ticket.status.value, 0) + 1
    print(json.dumps({"tickets": len(graph.tickets), "states": counts, "frontier": [t.id for t in graph.ready_frontier()]}, indent=2, sort_keys=True))
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="yaaw", description="yaaw-SE deterministic workflow utilities")
    parser.add_argument("--tickets", default="tickets", help="ticket root directory")
    sub = parser.add_subparsers(dest="command", required=True)
    sub.add_parser("validate").set_defaults(func=cmd_validate)
    sub.add_parser("frontier").set_defaults(func=cmd_frontier)
    sub.add_parser("status").set_defaults(func=cmd_status)
    return parser


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    return args.func(args)
