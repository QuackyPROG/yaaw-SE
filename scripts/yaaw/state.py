"""Legal ticket transitions and admission gates."""
from __future__ import annotations

from dataclasses import dataclass

from .model import ALLOWED_TRANSITIONS, Ticket, TicketState


class TransitionError(ValueError):
    pass


@dataclass(frozen=True)
class TransitionContext:
    owner_resolved: bool = False
    blockers_done: bool = False
    acceptance_bounded: bool = False
    sources_current: bool = False
    implementation_evidence: bool = False
    verification_complete: bool = False
    qa_satisfied: bool = False
    delivery_satisfied: bool = False


def validate_transition(ticket: Ticket, target: TicketState, ctx: TransitionContext) -> None:
    if target not in ALLOWED_TRANSITIONS[ticket.status]:
        raise TransitionError(f"illegal transition {ticket.status.value} -> {target.value} for {ticket.id}")
    if target is TicketState.READY:
        missing = []
        if not ctx.owner_resolved:
            missing.append("owner_resolved")
        if not ctx.blockers_done:
            missing.append("blockers_done")
        if not ctx.acceptance_bounded:
            missing.append("acceptance_bounded")
        if not ctx.sources_current:
            missing.append("sources_current")
        if missing:
            raise TransitionError(f"{ticket.id} cannot become READY; missing: {', '.join(missing)}")
    if target is TicketState.VERIFYING and not ctx.implementation_evidence:
        raise TransitionError(f"{ticket.id} cannot VERIFY without implementation evidence")
    if target is TicketState.DONE:
        missing = []
        if not ctx.verification_complete:
            missing.append("verification_complete")
        if ticket.qa_required and not ctx.qa_satisfied:
            missing.append("qa_satisfied")
        if not ctx.delivery_satisfied:
            missing.append("delivery_satisfied")
        if missing:
            raise TransitionError(f"{ticket.id} cannot become DONE; missing: {', '.join(missing)}")
