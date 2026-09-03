#!/usr/bin/env python3
"""Validate current structured artifact schema identities and report required migrations."""
from __future__ import annotations

from pathlib import Path

from yaaw.frontmatter import parse
from yaaw.migrations import migrate_metadata, scan_structured

ROOT = Path(__file__).resolve().parents[1]


def main() -> int:
    errors = []
    pending = []
    for path in scan_structured(ROOT):
        try:
            doc = parse(path.read_text(encoding="utf-8"))
            _, changed = migrate_metadata(doc.metadata)
        except ValueError as exc:
            errors.append(f"{path.relative_to(ROOT)}: {exc}")
            continue
        if changed:
            pending.append(str(path.relative_to(ROOT)))
    for item in errors:
        print(f"ERROR: {item}")
    for item in pending:
        print(f"MIGRATION_REQUIRED: {item}")
    if errors or pending:
        return 1
    print("OK: structured artifact schemas are current")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
