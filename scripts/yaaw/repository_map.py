"""Compact repository-map queries used to construct bounded context capsules."""
from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path

from .ownership import matches


@dataclass(frozen=True)
class Subsystem:
    id: str
    paths: tuple[str, ...]
    interfaces: tuple[str, ...]
    tests: tuple[str, ...]
    docs: tuple[str, ...]


class RepositoryMap:
    def __init__(self, subsystems: list[Subsystem]):
        self.subsystems = subsystems

    @classmethod
    def load(cls, path: Path) -> "RepositoryMap":
        data = json.loads(path.read_text(encoding="utf-8"))
        if data.get("schema") != "yaaw.repository-map/v1":
            raise ValueError("unsupported repository-map schema")
        return cls([Subsystem(item["id"], tuple(item.get("paths", [])), tuple(item.get("interfaces", [])), tuple(item.get("tests", [])), tuple(item.get("docs", []))) for item in data.get("subsystems", [])])

    def for_path(self, path: str) -> list[Subsystem]:
        return [subsystem for subsystem in self.subsystems if any(matches(path, pattern) for pattern in subsystem.paths)]
