import unittest

from scripts.yaaw.model import Ticket, TicketKind, TicketState
from scripts.yaaw.state import TransitionContext, TransitionError, validate_transition


def ticket(status=TicketState.DRAFT, qa=False):
    return Ticket("DEL-1", TicketKind.DELIVERY, status, 2, "core", qa_required=qa)


class StateMachineTests(unittest.TestCase):
    def test_draft_cannot_jump_done(self):
        with self.assertRaises(TransitionError):
            validate_transition(ticket(), TicketState.DONE, TransitionContext())

    def test_ready_requires_admission_gates(self):
        with self.assertRaises(TransitionError):
            validate_transition(ticket(), TicketState.READY, TransitionContext(owner_resolved=True))
        validate_transition(ticket(), TicketState.READY, TransitionContext(owner_resolved=True, blockers_done=True, acceptance_bounded=True, sources_current=True))

    def test_done_requires_qa_when_required(self):
        t = ticket(TicketState.VERIFYING, qa=True)
        with self.assertRaises(TransitionError):
            validate_transition(t, TicketState.DONE, TransitionContext(verification_complete=True, delivery_satisfied=True))
        validate_transition(t, TicketState.DONE, TransitionContext(verification_complete=True, qa_satisfied=True, delivery_satisfied=True))


if __name__ == "__main__":
    unittest.main()
