import tempfile
import unittest
from pathlib import Path

from scripts.yaaw.budgets import Budget
from scripts.yaaw.controller import AdmissionError, Controller
from scripts.yaaw.graph import TicketGraph
from scripts.yaaw.leases import LeaseStore
from scripts.yaaw.model import Ticket, TicketKind, TicketState


class ControllerTests(unittest.TestCase):
    def make_controller(self, tickets):
        tmp = tempfile.TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        return Controller(TicketGraph(tickets), Budget({"max_agent_dispatches": 2, "max_same_failure_signature": 2, "max_total_llm_tokens": 1000, "max_total_llm_calls": 2}), LeaseStore(Path(tmp.name)))

    def test_admission_rejects_unknown_owner(self):
        t = Ticket("DEL-1", TicketKind.DELIVERY, TicketState.READY, 1, "UNKNOWN_OWNER", acceptance=("observable",))
        with self.assertRaises(AdmissionError):
            self.make_controller([t]).admit_dispatch("DEL-1", "a", "wt")

    def test_dispatch_claims_single_writer_lease(self):
        t = Ticket("DEL-1", TicketKind.DELIVERY, TicketState.READY, 1, "core", acceptance=("observable",))
        ctl = self.make_controller([t])
        ctl.admit_dispatch("DEL-1", "a", "wt")
        with self.assertRaises(Exception):
            ctl.admit_dispatch("DEL-1", "b", "wt")

    def test_repeated_failure_forces_replan(self):
        t = Ticket("DEL-1", TicketKind.DELIVERY, TicketState.READY, 1, "core", acceptance=("observable",))
        ctl = self.make_controller([t])
        ctl.register_failure("same")
        ctl.register_failure("same")
        with self.assertRaises(AdmissionError):
            ctl.register_failure("same")

    def test_llm_reservation_blocks_before_aggregate_budget_overrun(self):
        t = Ticket("DEL-1", TicketKind.DELIVERY, TicketState.READY, 1, "core", acceptance=("observable",))
        ctl = self.make_controller([t])
        ctl.reserve_llm_tokens(300, 100)
        ctl.reserve_llm_tokens(300, 100)
        with self.assertRaises(AdmissionError):
            ctl.reserve_llm_tokens(100, 100)
        self.assertEqual(ctl.budget.used["max_total_llm_tokens"], 800)
        self.assertEqual(ctl.budget.used["max_total_llm_calls"], 2)


if __name__ == "__main__":
    unittest.main()
