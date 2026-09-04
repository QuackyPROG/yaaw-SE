import json
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

    def test_agent_invocation_admission_is_atomic_across_dispatch_tokens_and_lease(self):
        t = Ticket("DEL-1", TicketKind.DELIVERY, TicketState.READY, 1, "core", acceptance=("observable",))
        ctl = self.make_controller([t])
        ctl.admit_agent_invocation("DEL-1", "agent-a", "wt-a", input_tokens=700, reserved_output_tokens=200, role="implementer")
        self.assertEqual(ctl.budget.used["max_agent_dispatches"], 1)
        self.assertEqual(ctl.budget.used["max_total_llm_tokens"], 900)
        self.assertEqual(ctl.budget.used["max_total_llm_calls"], 1)

        with self.assertRaises(AdmissionError):
            ctl.admit_agent_invocation("DEL-1", "agent-b", "wt-b", input_tokens=100, reserved_output_tokens=100, role="implementer")

        self.assertEqual(ctl.budget.used["max_agent_dispatches"], 1)
        self.assertEqual(ctl.budget.used["max_total_llm_tokens"], 900)
        self.assertEqual(ctl.budget.used["max_total_llm_calls"], 1)
        # The failed budget admission must not strand the temporary lease.
        ctl.leases.acquire("wt-b", "agent-b", "DEL-1")

    def test_repository_controller_preserves_model_budget_across_reconstruction(self):
        t = Ticket("DEL-1", TicketKind.DELIVERY, TicketState.READY, 1, "core", acceptance=("observable",))
        with tempfile.TemporaryDirectory() as td:
            root = Path(td)
            (root / "config").mkdir()
            (root / "config/controller-policy.json").write_text(json.dumps({
                "budgets": {
                    "max_agent_dispatches": 2,
                    "max_total_llm_tokens": 1000,
                    "max_total_llm_calls": 2,
                },
                "budget_state": {"path": ".yaaw/runtime/budgets.json"},
                "lease": {"root": ".yaaw/runtime/leases"},
                "recovery": {"snapshot": ".yaaw/runtime/controller-snapshot.json"},
            }), encoding="utf-8")
            first = Controller.from_repository(TicketGraph([t]), root=root)
            first.reserve_llm_tokens(300, 100)
            second = Controller.from_repository(TicketGraph([t]), root=root)
            self.assertEqual(second.budget.used["max_total_llm_tokens"], 400)
            self.assertEqual(second.budget.used["max_total_llm_calls"], 1)
            with self.assertRaises(AdmissionError):
                second.admit_agent_invocation("DEL-1", "agent", "wt", input_tokens=700, reserved_output_tokens=1, role="implementer")
            third = Controller.from_repository(TicketGraph([t]), root=root)
            self.assertEqual(third.budget.used["max_total_llm_tokens"], 400)
            self.assertEqual(third.budget.used["max_total_llm_calls"], 1)


if __name__ == "__main__":
    unittest.main()
