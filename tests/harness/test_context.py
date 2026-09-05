import unittest

from scripts.yaaw.context import from_ticket
from scripts.yaaw.model import Ticket, TicketKind, TicketState
from scripts.yaaw.retrieval import RetrievalResult
from scripts.yaaw.token_budget import ContextBudget, ContextBudgetExceeded, HeuristicTokenCounter


class ContextTests(unittest.TestCase):
    def ticket(self):
        return Ticket(
            "DEL-1",
            TicketKind.DELIVERY,
            TicketState.READY,
            1,
            "core",
            acceptance=("observable",),
            source_fingerprints={"src/a.py": "abc"},
            metadata={
                "goal": "change one bounded behavior",
                "allowed_write": ["src/**"],
                "forbidden_write": ["secrets/**"],
                "expected_change_surface": ["src/a.py"],
                "preservation_invariants": ["unrelated behavior remains unchanged"],
                "verification": ["python -m unittest tests.test_a"],
                "stop_triggers": ["owner changes"],
            },
        )

    def test_capsule_is_bounded_and_structured(self):
        capsule = from_ticket(self.ticket(), "implementer")
        rendered = capsule.render(2000)
        self.assertIn('"schema": "yaaw.handoff/v1"', rendered)
        self.assertIn("src/**", rendered)

    def test_oversized_legacy_char_capsule_fails(self):
        ticket = Ticket("DEL-1", TicketKind.DELIVERY, TicketState.READY, 1, "core", acceptance=("x" * 100,), metadata={})
        with self.assertRaises(ValueError):
            from_ticket(ticket, "implementer").render(20)

    def test_token_packer_preserves_contract_and_evicts_optional_evidence(self):
        counter = HeuristicTokenCounter(bytes_per_token=3.0, safety_factor=1.0)
        budget = ContextBudget("implementer", 1, max_window_tokens=1200, reserved_output_tokens=200, max_retrieval_tokens=240, max_single_evidence_tokens=90)
        results = [
            RetrievalResult("symbol_search", f"query-{i}", "x" * 900, f"symbol_search:{i}", 70)
            for i in range(8)
        ]
        capsule = from_ticket(self.ticket(), "implementer", retrieval_results=results, budget=budget, counter=counter)
        payload = capsule.payload
        self.assertEqual(payload["goal"], "change one bounded behavior")
        self.assertEqual(payload["allowed_write"], ["src/**"])
        self.assertEqual(payload["forbidden_write"], ["secrets/**"])
        self.assertLessEqual(counter.count_value(payload), budget.max_input_tokens)
        self.assertGreater(payload["context_budget"]["omitted_count"], 0)
        self.assertTrue(payload["retrieval_evidence"])

    def test_mandatory_contract_over_budget_requires_reslice(self):
        counter = HeuristicTokenCounter(bytes_per_token=3.0, safety_factor=1.0)
        budget = ContextBudget("implementer", 1, max_window_tokens=50, reserved_output_tokens=10, max_retrieval_tokens=10, max_single_evidence_tokens=5)
        with self.assertRaises(ContextBudgetExceeded):
            from_ticket(self.ticket(), "implementer", budget=budget, counter=counter)


if __name__ == "__main__":
    unittest.main()
