import json
import tempfile
import unittest
from pathlib import Path

from scripts.yaaw.budgets import Budget, BudgetExceeded
from scripts.yaaw.leases import LeaseError, LeaseStore


class BudgetLeaseTests(unittest.TestCase):
    def test_budget_stops_livelock(self):
        budget = Budget({"repair": 2})
        budget.consume("repair")
        budget.consume("repair")
        with self.assertRaises(BudgetExceeded):
            budget.consume("repair")

    def test_multi_budget_reservation_is_atomic(self):
        budget = Budget({"tokens": 100, "calls": 1})
        with self.assertRaises(BudgetExceeded):
            budget.consume_many({"tokens": 50, "calls": 2})
        self.assertEqual(budget.used, {})
        budget.consume_many({"tokens": 50, "calls": 1})
        self.assertEqual(budget.used, {"tokens": 50, "calls": 1})

    def test_persistent_budget_survives_new_controller_object(self):
        with tempfile.TemporaryDirectory() as td:
            state = Path(td) / "runtime" / "budgets.json"
            first = Budget({"tokens": 100, "calls": 2}, state_path=state)
            first.consume_many({"tokens": 60, "calls": 1})
            second = Budget({"tokens": 100, "calls": 2}, state_path=state)
            self.assertEqual(second.used, {"tokens": 60, "calls": 1})
            with self.assertRaises(BudgetExceeded):
                second.consume_many({"tokens": 50, "calls": 1})
            third = Budget({"tokens": 100, "calls": 2}, state_path=state)
            self.assertEqual(third.used, {"tokens": 60, "calls": 1})

    def test_budget_from_policy_resolves_repository_runtime_state(self):
        with tempfile.TemporaryDirectory() as td:
            root = Path(td)
            config = root / "config"
            config.mkdir()
            policy = config / "controller-policy.json"
            policy.write_text(json.dumps({
                "budgets": {"max_total_llm_tokens": 1000},
                "budget_state": {"path": ".yaaw/runtime/budgets.json"},
            }), encoding="utf-8")
            budget = Budget.from_policy(policy, root=root)
            budget.consume("max_total_llm_tokens", 400)
            reloaded = Budget.from_policy(policy, root=root)
            self.assertEqual(reloaded.used["max_total_llm_tokens"], 400)
            self.assertEqual(reloaded.remaining("max_total_llm_tokens"), 600)

    def test_single_writer_lease(self):
        with tempfile.TemporaryDirectory() as tmp:
            store = LeaseStore(Path(tmp))
            store.acquire("worktree-main", "agent-a", "DEL-1")
            with self.assertRaises(LeaseError):
                store.acquire("worktree-main", "agent-b", "DEL-2")
            store.release("worktree-main", "agent-a")
            store.acquire("worktree-main", "agent-b", "DEL-2")


if __name__ == "__main__":
    unittest.main()
