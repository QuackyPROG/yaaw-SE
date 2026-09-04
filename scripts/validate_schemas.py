#!/usr/bin/env python3
"""Validate JSON Schemas plus structured core templates and machine-readable config fixtures."""
from __future__ import annotations

import json
from pathlib import Path

from jsonschema import Draft202012Validator

from yaaw.frontmatter import parse

ROOT = Path(__file__).resolve().parents[1]
SCHEMA_DIR = ROOT / ".agents/schemas"

TEMPLATE_SCHEMAS = {
    "docs/templates/discovery-ticket.md": "ticket.schema.json",
    "docs/templates/decision-ticket.md": "ticket.schema.json",
    "docs/templates/delivery-ticket.md": "ticket.schema.json",
    "docs/templates/prd.md": "prd.schema.json",
    "docs/templates/spec.md": "spec.schema.json",
    "docs/templates/adr.md": "adr.schema.json",
    "docs/templates/initiative-map.md": "initiative-map.schema.json",
    "docs/templates/plan-delta.md": "plan-delta.schema.json",
}

JSON_INSTANCE_SCHEMAS = {
    "examples/domain-pack/.yaaw/domain-pack.json": "domain-pack.schema.json",
    "examples/domain-pack/.yaaw/repository-map.json": "repository-map.schema.json",
    "config/model-profiles.example.json": "model-profiles.schema.json",
    "config/operating-modes.json": "operating-modes.schema.json",
    "config/runtime-adapters.json": "runtime-adapters.schema.json",
}


def load_schema(name: str) -> dict:
    schema = json.loads((SCHEMA_DIR / name).read_text(encoding="utf-8"))
    Draft202012Validator.check_schema(schema)
    return schema


def validate() -> list[str]:
    errors: list[str] = []
    schemas: dict[str, dict] = {}
    for path in sorted(SCHEMA_DIR.glob("*.json")):
        try:
            schemas[path.name] = load_schema(path.name)
        except Exception as exc:
            errors.append(f"{path.relative_to(ROOT)}: invalid schema: {exc}")

    for rel_path, schema_name in TEMPLATE_SCHEMAS.items():
        if schema_name not in schemas:
            continue
        try:
            metadata = parse((ROOT / rel_path).read_text(encoding="utf-8")).metadata
            validator = Draft202012Validator(schemas[schema_name])
            for error in sorted(validator.iter_errors(metadata), key=lambda e: list(e.path)):
                location = ".".join(str(v) for v in error.path) or "<root>"
                errors.append(f"{rel_path}:{location}: {error.message}")
        except Exception as exc:
            errors.append(f"{rel_path}: {exc}")

    for rel_path, schema_name in JSON_INSTANCE_SCHEMAS.items():
        if schema_name not in schemas:
            errors.append(f"{rel_path}: schema {schema_name} is not loadable")
            continue
        try:
            instance = json.loads((ROOT / rel_path).read_text(encoding="utf-8"))
            validator = Draft202012Validator(schemas[schema_name])
            for error in sorted(validator.iter_errors(instance), key=lambda e: list(e.path)):
                location = ".".join(str(v) for v in error.path) or "<root>"
                errors.append(f"{rel_path}:{location}: {error.message}")
        except Exception as exc:
            errors.append(f"{rel_path}: {exc}")
    return errors


def main() -> int:
    errors = validate()
    if errors:
        for error in errors:
            print(f"ERROR: {error}")
        return 1
    print("OK: schemas and structured fixtures validate")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
