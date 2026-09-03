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
