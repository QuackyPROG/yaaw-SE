"""Append-only ephemeral runtime event and correlated trace stream."""
from __future__ import annotations

import json
import uuid
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from .security import redact_secrets


@dataclass(frozen=True)
class TraceContext:
    run_id: str
    trace_id: str

    @classmethod
    def new(cls, *, run_id: str | None = None, trace_id: str | None = None) -> "TraceContext":
        return cls(run_id or f"run_{uuid.uuid4().hex}", trace_id or f"trace_{uuid.uuid4().hex}")

    def span_id(self) -> str:
        return f"span_{uuid.uuid4().hex}"


def _sanitize(value: Any) -> Any:
    if isinstance(value, str):
        return redact_secrets(value)
    if isinstance(value, dict):
        return {str(key): _sanitize(item) for key, item in value.items()}
    if isinstance(value, (list, tuple)):
        return [_sanitize(item) for item in value]
    return value


def validate_event(record: dict[str, Any]) -> None:
    if not isinstance(record, dict):
        raise ValueError("event must be an object")
    for field in ("schema", "event", "work_id", "actor", "timestamp"):
        value = record.get(field)
        if not isinstance(value, str) or not value.strip():
            raise ValueError(f"event missing non-empty {field}")
    if record["schema"] != "yaaw.event/v1":
        raise ValueError(f"unsupported event schema {record['schema']!r}")
    trace_fields = ("run_id", "trace_id", "span_id")
    present = [field for field in trace_fields if record.get(field)]
    if present and len(present) != len(trace_fields):
        raise ValueError("correlated event must include run_id, trace_id and span_id together")
    for field in trace_fields:
        if field in record and (not isinstance(record[field], str) or not record[field].strip()):
            raise ValueError(f"event {field} must be a non-empty string")
    for field in ("duration_ms", "tokens"):
        if field in record and (not isinstance(record[field], int) or record[field] < 0):
            raise ValueError(f"event {field} must be a non-negative integer")
    if "cost_usd" in record and (not isinstance(record["cost_usd"], (int, float)) or record["cost_usd"] < 0):
        raise ValueError("event cost_usd must be non-negative")


def _append(path: Path, record: dict[str, Any]) -> dict[str, Any]:
    sanitized = _sanitize(record)
    validate_event(sanitized)
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("a", encoding="utf-8") as fh:
        fh.write(json.dumps(sanitized, sort_keys=True) + "\n")
    return sanitized


def append_event(path: Path, event: str, work_id: str, actor: str, **details: Any) -> dict[str, Any]:
    record = {
        "schema": "yaaw.event/v1",
        "event": event,
        "work_id": work_id,
        "actor": actor,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        **details,
    }
    return _append(path, record)


def append_trace_event(
    path: Path,
    event: str,
    work_id: str,
    actor: str,
    trace: TraceContext,
    *,
    span_id: str | None = None,
    parent_span_id: str | None = None,
    **details: Any,
) -> dict[str, Any]:
    record = {
        "schema": "yaaw.event/v1",
        "event": event,
        "work_id": work_id,
        "actor": actor,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "run_id": trace.run_id,
        "trace_id": trace.trace_id,
        "span_id": span_id or trace.span_id(),
        **details,
    }
    if parent_span_id is not None:
        record["parent_span_id"] = parent_span_id
    return _append(path, record)
