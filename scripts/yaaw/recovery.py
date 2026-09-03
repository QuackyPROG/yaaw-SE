"""Atomic ephemeral controller snapshots for crash-safe resumption."""
from __future__ import annotations

import json
import os
import tempfile
from dataclasses import dataclass, asdict
from pathlib import Path


@dataclass
class RuntimeSnapshot:
    active_work: str | None
    active_role: str | None
    worktree: str | None
    base_sha: str | None
    dispatch_attempt: int = 0
    failure_signatures: dict[str, int] | None = None


class SnapshotStore:
    def __init__(self, path: Path):
        self.path = path

    def save(self, snapshot: RuntimeSnapshot) -> None:
        self.path.parent.mkdir(parents=True, exist_ok=True)
        fd, tmp_name = tempfile.mkstemp(prefix=self.path.name, dir=self.path.parent)
        try:
            with os.fdopen(fd, "w", encoding="utf-8") as fh:
                json.dump(asdict(snapshot), fh, indent=2, sort_keys=True)
                fh.write("\n")
            os.replace(tmp_name, self.path)
        finally:
            if os.path.exists(tmp_name):
                os.unlink(tmp_name)

    def load(self) -> RuntimeSnapshot | None:
        if not self.path.exists():
            return None
        return RuntimeSnapshot(**json.loads(self.path.read_text(encoding="utf-8")))

    def clear(self) -> None:
        self.path.unlink(missing_ok=True)
