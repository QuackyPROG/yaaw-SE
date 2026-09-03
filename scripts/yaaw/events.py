"""Append-only ephemeral runtime event stream."""
from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


def append_event(path: Path, event: str, work_id: str, actor: str, **details: Any) -> dict[str, Any]:
    record = {"schema": "yaaw.event/v1", "event": event, "work_id": work_id, "actor": actor, "timestamp": datetime.now(timezone.utc).isoformat(), **details}
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("a", encoding="utf-8") as fh:
        fh.write(json.dumps(record, sort_keys=True) + "\n")
    return record
