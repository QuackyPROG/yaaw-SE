#!/usr/bin/env python3
"""Validate runtime adapters against the generic authority-role/capability contract."""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REQUIRED = {"root_only_delegation", "fresh_child_context", "bounded_parallelism", "model_neutral", "controller_admission", "token_budget_admission", "trust_boundary_instructions"}


def main() -> int:
    registry = json.loads((ROOT / "config/runtime-adapters.json").read_text(encoding="utf-8"))
    catalog = json.loads((ROOT / ".agents/catalog.json").read_text(encoding="utf-8"))
    roles = {item["id"] for item in catalog.get("authority_roles", [])}
    errors = []
    for adapter_id, spec in registry.get("adapters", {}).items():
        declared_roles = set(spec.get("roles", []))
        if declared_roles != roles:
            errors.append(f"{adapter_id}: authority-role set mismatch: {sorted(declared_roles)} != {sorted(roles)}")
        missing = REQUIRED - set(spec.get("capabilities", []))
        if missing:
            errors.append(f"{adapter_id}: missing generic capabilities {sorted(missing)}")
        for key in ("config", "validator"):
            if not (ROOT / spec[key]).exists():
                errors.append(f"{adapter_id}: missing {key} path {spec[key]}")
        if spec.get("model_policy") != "EXTERNAL_CAPABILITY_PROFILE":
            errors.append(f"{adapter_id}: model policy must stay external/capability-based")
    if errors:
        for error in errors:
            print(f"ERROR: {error}")
        return 1
    print(f"OK: {len(registry.get('adapters', {}))} runtime adapter(s) satisfy generic conformance")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
