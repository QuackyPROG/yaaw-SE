"""Operating-mode policy may strengthen ceremony/gates but never weaken route safety or authority."""
from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path

QA_ORDER = {"SELF_VERIFY": 0, "INDEPENDENT": 1, "HIGH_ASSURANCE": 2}


@dataclass(frozen=True)
class OperatingMode:
    name: str
    durable_from_level: int
    qa_floor: str
    fresh_implementer_from_level: int
    allow_optional_release_engineer_skip: bool
    network_default: str

    def effective_qa(self, route_qa: str) -> str:
        if route_qa not in QA_ORDER or self.qa_floor not in QA_ORDER:
            raise ValueError("unknown QA policy")
        return route_qa if QA_ORDER[route_qa] >= QA_ORDER[self.qa_floor] else self.qa_floor

    def durable_required(self, level: int) -> bool:
        return level >= self.durable_from_level


def load_mode(path: Path, name: str) -> OperatingMode:
    data = json.loads(path.read_text(encoding="utf-8"))
    try:
        spec = data["modes"][name]
    except KeyError as exc:
        raise ValueError(f"unknown operating mode {name!r}") from exc
    return OperatingMode(
        name=name,
        durable_from_level=int(spec["durable_from_level"]),
        qa_floor=spec["qa_floor"],
        fresh_implementer_from_level=int(spec["fresh_implementer_from_level"]),
        allow_optional_release_engineer_skip=bool(spec["allow_optional_release_engineer_skip"]),
        network_default=spec["network_default"],
    )
