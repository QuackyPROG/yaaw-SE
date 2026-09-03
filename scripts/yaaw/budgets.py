"""Execution backpressure for dispatch, repair, replan and tool retries."""
from __future__ import annotations

from dataclasses import dataclass, field


class BudgetExceeded(RuntimeError):
    pass


@dataclass
class Budget:
    limits: dict[str, int]
    used: dict[str, int] = field(default_factory=dict)

    def consume(self, name: str, amount: int = 1) -> int:
        if amount < 0:
            raise ValueError("budget consumption cannot be negative")
        limit = self.limits.get(name)
        new_value = self.used.get(name, 0) + amount
        if limit is not None and new_value > limit:
            raise BudgetExceeded(f"budget {name} exceeded: {new_value}>{limit}")
        self.used[name] = new_value
        return new_value

    def remaining(self, name: str) -> int | None:
        limit = self.limits.get(name)
        return None if limit is None else max(0, limit - self.used.get(name, 0))
