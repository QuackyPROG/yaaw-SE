"""Execution backpressure for dispatch, repair, replan, tool and model-resource budgets."""
from __future__ import annotations

import json
import os
import uuid
from dataclasses import dataclass, field
from pathlib import Path


class BudgetExceeded(RuntimeError):
    pass


@dataclass
class Budget:
    limits: dict[str, int]
    used: dict[str, int] = field(default_factory=dict)
    state_path: Path | None = None

    def __post_init__(self) -> None:
        self.limits = {str(name): int(value) for name, value in self.limits.items()}
        self.used = {str(name): int(value) for name, value in self.used.items()}
        if any(value < 0 for value in self.limits.values()) or any(value < 0 for value in self.used.values()):
            raise ValueError("budget limits/usage cannot be negative")
        if self.state_path is not None:
            self.state_path = Path(self.state_path)
            persisted = self._read_state()
            if persisted is not None:
                self.used = persisted

    @classmethod
    def from_policy(cls, policy_path: Path, *, root: Path | None = None) -> "Budget":
        policy_path = Path(policy_path)
        data = json.loads(policy_path.read_text(encoding="utf-8"))
        limits = data.get("budgets")
        if not isinstance(limits, dict) or any(not isinstance(v, int) or v < 0 for v in limits.values()):
            raise ValueError(f"{policy_path}: budgets must be non-negative integers")
        state = data.get("budget_state", {})
        state_ref = state.get("path") if isinstance(state, dict) else None
        state_path = None
        if state_ref:
            base = Path(root) if root is not None else policy_path.resolve().parents[1]
            state_path = (base / str(state_ref)).resolve()
            state_path.relative_to(base.resolve())
        return cls(dict(limits), state_path=state_path)

    def _read_state(self) -> dict[str, int] | None:
        if self.state_path is None or not self.state_path.exists():
            return None
        value = json.loads(self.state_path.read_text(encoding="utf-8"))
        if not isinstance(value, dict) or value.get("schema") != "yaaw.budget-state/v1":
            raise ValueError(f"{self.state_path}: unsupported budget state")
        used = value.get("used", {})
        if not isinstance(used, dict) or any(not isinstance(v, int) or v < 0 for v in used.values()):
            raise ValueError(f"{self.state_path}: budget usage must be non-negative integers")
        return {str(name): int(amount) for name, amount in used.items()}

    def _write_state(self, used: dict[str, int]) -> None:
        if self.state_path is None:
            return
        self.state_path.parent.mkdir(parents=True, exist_ok=True)
        temp = self.state_path.with_name(f".{self.state_path.name}.{uuid.uuid4().hex}.tmp")
        payload = json.dumps({"schema": "yaaw.budget-state/v1", "used": used}, indent=2, sort_keys=True) + "\n"
        try:
            with temp.open("w", encoding="utf-8") as handle:
                handle.write(payload)
                handle.flush()
                os.fsync(handle.fileno())
            os.replace(temp, self.state_path)
        finally:
            if temp.exists():
                temp.unlink()

    def consume(self, name: str, amount: int = 1) -> int:
        return self.consume_many({name: amount})[name]

    def consume_many(self, amounts: dict[str, int]) -> dict[str, int]:
        if self.state_path is not None:
            persisted = self._read_state()
            if persisted is not None:
                self.used = persisted
        projected: dict[str, int] = {}
        for name, amount in amounts.items():
            if amount < 0:
                raise ValueError("budget consumption cannot be negative")
            value = self.used.get(name, 0) + amount
            limit = self.limits.get(name)
            if limit is not None and value > limit:
                raise BudgetExceeded(f"budget {name} exceeded: {value}>{limit}")
            projected[name] = value
        next_used = dict(self.used)
        next_used.update(projected)
        self._write_state(next_used)
        self.used = next_used
        return projected

    def remaining(self, name: str) -> int | None:
        if self.state_path is not None:
            persisted = self._read_state()
            if persisted is not None:
                self.used = persisted
        limit = self.limits.get(name)
        return None if limit is None else max(0, limit - self.used.get(name, 0))
