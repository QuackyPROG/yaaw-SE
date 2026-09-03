"""Compact runtime metrics derived from append-only controller events."""
from __future__ import annotations

import json
from collections import Counter
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Iterable


@dataclass(frozen=True)
class RuntimeMetrics:
    events: int
    counters: dict[str, int]
    qa_pass_rate: float | None
    total_tokens: int
    total_cost_usd: float
    total_duration_ms: int

    def to_dict(self) -> dict:
        return asdict(self)


def summarize(records: Iterable[dict]) -> RuntimeMetrics:
    items = list(records)
    counters = Counter(str(item.get("event", "UNKNOWN")) for item in items)
    qa = [item for item in items if item.get("event") == "QA_RESULT"]
    qa_pass = sum(1 for item in qa if item.get("result") == "PASS")
    qa_rate = (qa_pass / len(qa)) if qa else None
    return RuntimeMetrics(
        events=len(items),
        counters=dict(sorted(counters.items())),
        qa_pass_rate=qa_rate,
        total_tokens=sum(int(item.get("tokens", 0) or 0) for item in items),
        total_cost_usd=round(sum(float(item.get("cost_usd", 0.0) or 0.0) for item in items), 6),
        total_duration_ms=sum(int(item.get("duration_ms", 0) or 0) for item in items),
    )


def load_jsonl(path: Path) -> list[dict]:
    if not path.exists():
        return []
    records = []
    for number, line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
        if not line.strip():
            continue
        value = json.loads(line)
        if not isinstance(value, dict):
            raise ValueError(f"{path}:{number}: event must be an object")
        records.append(value)
    return records
