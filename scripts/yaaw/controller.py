"""Deterministic admission layer around LLM engineering judgments."""
from __future__ import annotations

from dataclasses import dataclass, field

from .budgets import Budget
from .graph import TicketGraph
from .leases import LeaseStore
from .model import Ticket, TicketState
from .state import TransitionContext, validate_transition


class AdmissionError(RuntimeError):
    pass


@dataclass
class Controller:
    graph: TicketGraph
    budget: Budget
    leases: LeaseStore
    failure_signatures: dict[str, int] = field(default_factory=dict)

    def admit_dispatch(self, ticket_id: str, holder: str, worktree: str, sources_current: bool = True) -> Ticket:
        ticket = self.graph.tickets.get(ticket_id)
        if ticket is None:
            raise AdmissionError(f"unknown ticket {ticket_id}")
        if ticket.status is not TicketState.READY:
            raise AdmissionError(f"ticket {ticket_id} is {ticket.status.value}, not READY")
        unresolved = [d for d in ticket.blocked_by if self.graph.tickets.get(d) is None or self.graph.tickets[d].status is not TicketState.DONE]
        if unresolved:
            raise AdmissionError(f"ticket {ticket_id} has unresolved blockers: {', '.join(unresolved)}")
        if ticket.owner == "UNKNOWN_OWNER":
            raise AdmissionError(f"ticket {ticket_id} has unresolved ownership")
        if not ticket.acceptance:
            raise AdmissionError(f"ticket {ticket_id} has no observable acceptance criteria")
        if not sources_current:
            raise AdmissionError(f"ticket {ticket_id} has stale source fingerprints")
        self.budget.consume("max_agent_dispatches")
        self.leases.acquire(worktree, holder, ticket_id)
        return ticket

    def release_dispatch(self, worktree: str, holder: str) -> None:
        self.leases.release(worktree, holder)

    def validate_completion(self, ticket: Ticket, verification_complete: bool, qa_satisfied: bool, delivery_satisfied: bool) -> None:
        validate_transition(ticket, TicketState.DONE, TransitionContext(verification_complete=verification_complete, qa_satisfied=qa_satisfied, delivery_satisfied=delivery_satisfied))

    def register_failure(self, signature: str) -> int:
        count = self.failure_signatures.get(signature, 0) + 1
        self.failure_signatures[signature] = count
        limit = self.budget.limits.get("max_same_failure_signature", 2)
        if count > limit:
            raise AdmissionError(f"failure signature repeated {count} times; STOP_AND_REPLAN required: {signature}")
        return count
