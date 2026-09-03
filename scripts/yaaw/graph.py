"""Deterministic ticket graph validation and frontier computation."""
from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

from .model import TERMINAL_STATES, Ticket, TicketState


class GraphError(ValueError):
    pass


@dataclass(frozen=True)
class GraphDiagnostics:
    missing_blockers: tuple[str, ...] = ()
    cycles: tuple[tuple[str, ...], ...] = ()
    impossible_ready: tuple[str, ...] = ()

    @property
    def ok(self) -> bool:
        return not (self.missing_blockers or self.cycles or self.impossible_ready)


class TicketGraph:
    def __init__(self, tickets: Iterable[Ticket]):
        items = list(tickets)
        ids = [t.id for t in items]
        duplicates = sorted({i for i in ids if ids.count(i) > 1})
        if duplicates:
            raise GraphError(f"duplicate ticket ids: {', '.join(duplicates)}")
        self.tickets = {t.id: t for t in items}

    @classmethod
    def from_directory(cls, root: Path) -> "TicketGraph":
        tickets = []
        for path in sorted(root.rglob("*.md")):
            if path.name.lower() == "readme.md":
                continue
            text = path.read_text(encoding="utf-8")
            if not text.startswith("---yaaw-json"):
                continue
            tickets.append(Ticket.from_markdown(text, path))
        return cls(tickets)

    def diagnostics(self) -> GraphDiagnostics:
        missing = []
        impossible_ready = []
        for ticket in self.tickets.values():
            for dep in ticket.blocked_by:
                if dep not in self.tickets:
                    missing.append(f"{ticket.id}->{dep}")
            if ticket.status is TicketState.READY:
                unresolved = [d for d in ticket.blocked_by if d in self.tickets and self.tickets[d].status is not TicketState.DONE]
                if unresolved:
                    impossible_ready.append(f"{ticket.id} blocked by {','.join(unresolved)}")
        cycles = tuple(self._cycles())
        return GraphDiagnostics(tuple(sorted(missing)), cycles, tuple(sorted(impossible_ready)))

    def _cycles(self) -> list[tuple[str, ...]]:
        visiting: set[str] = set()
        visited: set[str] = set()
        stack: list[str] = []
        found: set[tuple[str, ...]] = set()

        def walk(node: str) -> None:
            if node in visited:
                return
            if node in visiting:
                idx = stack.index(node)
                cycle = stack[idx:] + [node]
                core = cycle[:-1]
                if core:
                    rotations = [tuple(core[i:] + core[:i]) for i in range(len(core))]
                    found.add(min(rotations))
                return
            visiting.add(node)
            stack.append(node)
            for dep in self.tickets[node].blocked_by:
                if dep in self.tickets:
                    walk(dep)
            stack.pop()
            visiting.remove(node)
            visited.add(node)

        for node in sorted(self.tickets):
            walk(node)
        return sorted(found)

    def ready_frontier(self) -> list[Ticket]:
        result = []
        for ticket in self.tickets.values():
            if ticket.status is not TicketState.READY:
                continue
            if all(self.tickets.get(dep) and self.tickets[dep].status is TicketState.DONE for dep in ticket.blocked_by):
                result.append(ticket)
        return sorted(result, key=lambda t: t.id)

    def unfinished(self) -> list[Ticket]:
        return sorted((t for t in self.tickets.values() if t.status not in TERMINAL_STATES), key=lambda t: t.id)

    def deadlock_reasons(self) -> list[str]:
        if self.ready_frontier() or not self.unfinished():
            return []
        reasons = []
        diagnostics = self.diagnostics()
        reasons.extend(f"missing blocker {x}" for x in diagnostics.missing_blockers)
        reasons.extend(f"cycle {' -> '.join(c)} -> {c[0]}" for c in diagnostics.cycles)
        for ticket in self.unfinished():
            unresolved = [d for d in ticket.blocked_by if d in self.tickets and self.tickets[d].status is not TicketState.DONE]
            if unresolved:
                reasons.append(f"{ticket.id} waiting on {', '.join(unresolved)}")
            elif ticket.status is TicketState.BLOCKED:
                reasons.append(f"{ticket.id} is BLOCKED without a graph blocker; external/human reason must be recorded")
            elif ticket.status is TicketState.DRAFT:
                reasons.append(f"{ticket.id} remains DRAFT and needs admission to READY")
            elif ticket.status in {TicketState.IN_PROGRESS, TicketState.VERIFYING}:
                reasons.append(f"{ticket.id} is {ticket.status.value}; active work prevents an empty-frontier completion")
        return sorted(set(reasons))
