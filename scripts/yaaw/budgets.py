"""Execution backpressure for dispatch, repair, replan, tool and model-resource budgets."""
from __future__ import annotations

from dataclasses import dataclass, field


class BudgetExceeded(RuntimeError):
    pass


@dataclass
class Budget:
    limits: dict[str, int]
    used: dict[str, int] = field(default_factory=dict)

    def consume(self, name: str, amount: int = 1) -> int:
        return self.consume_many({name: amount})[name]

    def consume_many(self, amounts: dict[str, int]) -> dict[str, int]:
        projected: dict[str, int] = {}
        for name, amount in amounts.items():
            if amount < 0:
                raise ValueError("budget consumption cannot be negative")
            value = self.used.get(name, 0) + amount
            limit = self.limits.get(name)
            if limit is not None and value > limit:
                raise BudgetExceeded(f"budget {name} exceeded: {value}>{limit}")
            projected[name] = value
        self.used.update(projected)
        return projected

    def remaining(self, name: str) -> int | None:
        limit = self.limits.get(name)
        return None if limit is None else max(0, limit - self.used.get(name, 0))
