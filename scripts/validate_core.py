#!/usr/bin/env python3
"""Structural validation for the YAAW-SE v2 workflow core."""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CORE = ROOT / ".yaaw-core"


def load_json(path: Path):
    with path.open(encoding="utf-8") as f:
        return json.load(f)


def main() -> int:
    workflows = load_json(CORE / "registries/workflows.json")
    skills = load_json(CORE / "registries/skills.json")
    expertise = load_json(CORE / "registries/expertise.json")

    errors: list[str] = []
    allowed_roles = {"prd", "planner", "implementer", "reviewer", "orchestrator"}

    for workflow_id, entry in workflows.items():
        if entry.get("role") not in allowed_roles:
            errors.append(f"{workflow_id}: invalid role {entry.get('role')!r}")
        path = ROOT / entry.get("workflow", "")
        if not path.is_file():
            errors.append(f"{workflow_id}: missing workflow file {path.relative_to(ROOT)}")

    for skill_id, entry in skills.items():
        wf = entry.get("workflow_id")
        if wf not in workflows:
            errors.append(f"{skill_id}: unknown workflow {wf!r}")
            continue
        if entry.get("role") != workflows[wf].get("role"):
            errors.append(f"{skill_id}: role mismatch with {wf}")
        skill_path = ROOT / "skills" / skill_id / "SKILL.md"
        if not skill_path.is_file():
            errors.append(f"{skill_id}: missing {skill_path.relative_to(ROOT)}")
        elif len(skill_path.read_text(encoding="utf-8").splitlines()) > 20:
            errors.append(f"{skill_id}: wrapper is too large; workflow logic likely leaked into public API")

    for expertise_id, entry in expertise.items():
        path = ROOT / entry.get("path", "")
        if not path.is_file():
            errors.append(f"{expertise_id}: missing module {path.relative_to(ROOT)}")
        invalid = set(entry.get("usable_by", [])) - allowed_roles
        if invalid:
            errors.append(f"{expertise_id}: invalid usable_by roles {sorted(invalid)}")

    for schema in (CORE / "schemas").glob("*.json"):
        try:
            load_json(schema)
        except Exception as exc:  # noqa: BLE001
            errors.append(f"{schema.relative_to(ROOT)}: invalid JSON: {exc}")

    if errors:
        print("YAAW core validation failed:")
        for error in errors:
            print(f"- {error}")
        return 1

    print(f"YAAW core validation passed: {len(skills)} skills, {len(workflows)} workflows, {len(expertise)} expertise modules")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
