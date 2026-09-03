"""Explicit durable-artifact schema migrations; never rewrite unknown formats implicitly."""
from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Callable

from .frontmatter import dump, parse
from .schema_versions import CURRENT_SCHEMAS, schema_kind

MetadataMigration = Callable[[dict], dict]


@dataclass(frozen=True)
class MigrationResult:
    path: Path
    before: str
    after: str
    changed: bool


def _ticket_v0_to_v1(meta: dict) -> dict:
    result = dict(meta)
    result["schema"] = "yaaw.ticket/v1"
    if "qa" not in result:
        result["qa"] = {"required": bool(result.pop("qa_required", False))}
    result.setdefault("blocked_by", [])
    result.setdefault("acceptance", [])
    result.setdefault("owner", "UNKNOWN_OWNER")
    result.setdefault("level", 1)
    return result


MIGRATIONS: dict[str, tuple[str, MetadataMigration]] = {
    "yaaw.ticket/v0": ("yaaw.ticket/v1", _ticket_v0_to_v1),
}


def migrate_metadata(metadata: dict) -> tuple[dict, bool]:
    current = dict(metadata)
    original = dict(metadata)
    schema = str(current.get("schema", ""))
    if not schema:
        raise ValueError("structured artifact has no schema id")
    kind = schema_kind(schema)
    target = CURRENT_SCHEMAS.get(kind)
    if target is None:
        raise ValueError(f"unknown schema kind {kind!r}")
    visited: set[str] = set()
    while schema != target:
        if schema in visited:
            raise ValueError(f"schema migration cycle at {schema}")
        visited.add(schema)
        step = MIGRATIONS.get(schema)
        if step is None:
            raise ValueError(f"no declared migration from {schema} to {target}")
        next_schema, fn = step
        current = fn(current)
        if current.get("schema") != next_schema:
            raise ValueError(f"migration {schema} failed to produce {next_schema}")
        schema = next_schema
    return current, current != original


def migrate_file(path: Path, *, write: bool = False) -> MigrationResult:
    text = path.read_text(encoding="utf-8")
    doc = parse(text)
    metadata, changed = migrate_metadata(doc.metadata)
    after = dump(metadata, doc.body) if changed else text
    if changed and write:
        tmp = path.with_suffix(path.suffix + ".yaaw-migrate")
        tmp.write_text(after, encoding="utf-8")
        tmp.replace(path)
    return MigrationResult(path=path, before=text, after=after, changed=changed)


def scan_structured(root: Path) -> list[Path]:
    results = []
    for path in sorted(root.rglob("*.md")):
        try:
            first = path.open("r", encoding="utf-8").readline().strip()
        except OSError:
            continue
        if first == "---yaaw-json":
            results.append(path)
    return results
