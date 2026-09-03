"""Schema version registry and compatibility checks for durable yaaw-SE artifacts."""
from __future__ import annotations

CURRENT_SCHEMAS = {
    "ticket": "yaaw.ticket/v1",
    "prd": "yaaw.prd/v1",
    "spec": "yaaw.spec/v1",
    "adr": "yaaw.adr/v1",
    "initiative-map": "yaaw.initiative-map/v1",
    "plan-delta": "yaaw.plan-delta/v1",
    "handoff": "yaaw.handoff/v1",
    "domain-pack": "yaaw.domain-pack/v1",
}


def schema_kind(schema: str) -> str:
    if not schema.startswith("yaaw.") or "/v" not in schema:
        raise ValueError(f"invalid yaaw schema id {schema!r}")
    return schema[5:].split("/v", 1)[0]


def require_supported(schema: str) -> None:
    kind = schema_kind(schema)
    current = CURRENT_SCHEMAS.get(kind)
    if current is None:
        raise ValueError(f"unknown yaaw schema kind {kind!r}")
    if schema != current:
        raise ValueError(f"unsupported schema {schema!r}; current is {current!r}; run yaaw migrate")
