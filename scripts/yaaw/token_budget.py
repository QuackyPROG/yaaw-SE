"""Provider-neutral token estimation and context-budget policy.

Exact tokenization is provider/model specific. yaaw-SE therefore exposes a small
counter protocol and ships a conservative UTF-8 heuristic for deterministic
pre-dispatch budgeting. Runtime adapters may replace the counter with an exact
provider tokenizer without changing workflow semantics.
"""
from __future__ import annotations

import json
import math
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Protocol


class ContextBudgetExceeded(ValueError):
    pass


class TokenCounter(Protocol):
    def count_text(self, text: str) -> int: ...

    def count_value(self, value: Any) -> int: ...


@dataclass(frozen=True)
class HeuristicTokenCounter:
    bytes_per_token: float = 3.0
    safety_factor: float = 1.15

    def __post_init__(self) -> None:
        if self.bytes_per_token <= 0:
            raise ValueError("bytes_per_token must be positive")
        if self.safety_factor < 1.0:
            raise ValueError("safety_factor must be >= 1.0")

    def count_text(self, text: str) -> int:
        if not text:
            return 0
        raw = len(text.encode("utf-8"))
        return max(1, math.ceil((raw / self.bytes_per_token) * self.safety_factor))

    def count_value(self, value: Any) -> int:
        text = json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False)
        return self.count_text(text)


@dataclass(frozen=True)
class ContextBudget:
    role: str
    level: int
    max_window_tokens: int
    reserved_output_tokens: int
    max_retrieval_tokens: int
    max_single_evidence_tokens: int

    @property
    def max_input_tokens(self) -> int:
        return self.max_window_tokens - self.reserved_output_tokens

    def validate(self) -> None:
        if not 0 <= self.level <= 4:
            raise ValueError("context budget level must be 0..4")
        if self.max_window_tokens <= 0:
            raise ValueError("max_window_tokens must be positive")
        if not 0 <= self.reserved_output_tokens < self.max_window_tokens:
            raise ValueError("reserved_output_tokens must be >= 0 and smaller than max_window_tokens")
        if not 0 <= self.max_retrieval_tokens <= self.max_input_tokens:
            raise ValueError("max_retrieval_tokens must fit within the input budget")
        if self.max_single_evidence_tokens <= 0:
            raise ValueError("max_single_evidence_tokens must be positive")


@dataclass(frozen=True)
class ContextBudgetPolicy:
    counter: HeuristicTokenCounter
    roles: dict[str, dict[str, int]]
    level_multipliers: dict[int, float]

    @classmethod
    def load(cls, path: Path) -> "ContextBudgetPolicy":
        data = json.loads(path.read_text(encoding="utf-8"))
        if data.get("schema") != "yaaw.context-budget/v1":
            raise ValueError(f"{path}: unsupported context budget schema")
        estimator = data.get("estimator", {})
        if estimator.get("strategy") != "UTF8_HEURISTIC":
            raise ValueError(f"{path}: unsupported estimator strategy")
        counter = HeuristicTokenCounter(
            bytes_per_token=float(estimator.get("bytes_per_token", 3.0)),
            safety_factor=float(estimator.get("safety_factor", 1.15)),
        )
        roles = data.get("roles")
        if not isinstance(roles, dict) or "default" not in roles:
            raise ValueError(f"{path}: roles.default is required")
        multipliers = {int(k): float(v) for k, v in data.get("level_multipliers", {}).items()}
        for level in range(5):
            multipliers.setdefault(level, 1.0)
        return cls(counter=counter, roles={str(k): dict(v) for k, v in roles.items()}, level_multipliers=multipliers)

    def for_role(self, role: str, level: int, *, max_input_tokens: int | None = None) -> ContextBudget:
        source = self.roles.get(role, self.roles["default"])
        multiplier = self.level_multipliers.get(level, 1.0)
        window = max(1, int(int(source["max_window_tokens"]) * multiplier))
        reserve = max(0, int(int(source["reserved_output_tokens"]) * multiplier))
        retrieval = max(0, int(int(source["max_retrieval_tokens"]) * multiplier))
        single = max(1, int(int(source["max_single_evidence_tokens"]) * multiplier))
        if max_input_tokens is not None:
            if max_input_tokens <= 0:
                raise ValueError("max_input_tokens override must be positive")
            window = min(window, max_input_tokens + reserve)
            retrieval = min(retrieval, max_input_tokens)
        budget = ContextBudget(role, level, window, reserve, retrieval, single)
        budget.validate()
        return budget
