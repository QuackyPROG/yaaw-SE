#!/usr/bin/env python3
"""Validate machine-readable YAAW behavioral contracts and lifecycle fixtures."""
from __future__ import annotations

import json
from pathlib import Path

from behavior_oracle import run_fixture_cases

ROOT = Path(__file__).resolve().parents[1]
CORE = ROOT / ".yaaw-core"
FIXTURES = ROOT / "tests" / "fixtures" / "lifecycle_cases.json"


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def main() -> int:
    workflows = load_json(CORE / "registries" / "workflows.json")
    policy = load_json(CORE / "registries" / "routing-policy.json")
    transitions = load_json(CORE / "registries" / "transitions.json")
    fixtures = load_json(FIXTURES)
    errors: list[str] = []

    if policy.get("schema") != "yaaw.routing-policy/v1":
        errors.append("routing-policy schema id drifted")

    expected_precedence = [
        ("REPLAN_REQUIRED", "planning.replan"),
        ("REPAIR_REQUIRED", "implementation.repair-ticket"),
        ("REVIEW_REQUIRED", "review.review-ticket"),
        ("IN_PROGRESS", "orchestration.recover-interruption"),
        ("READY", "implementation.implement-ticket"),
    ]
    actual_precedence = [
        (entry.get("state"), entry.get("workflow"))
        for entry in policy.get("ticket_state_precedence", [])
    ]
    if actual_precedence != expected_precedence:
        errors.append(
            f"routing precedence drifted: expected={expected_precedence!r} actual={actual_precedence!r}"
        )

    policy_workflows = {
        policy.get("product_unready_workflow"),
        policy.get("planning_unready_workflow"),
        policy.get("missing_spec_workflow"),
        policy.get("missing_tickets_workflow"),
        policy.get("next_frontier_workflow"),
        *(entry.get("workflow") for entry in policy.get("ticket_state_precedence", [])),
    }
    for workflow in sorted(policy_workflows - {None}):
        if workflow not in workflows:
            errors.append(f"routing policy references unregistered workflow {workflow}")

    if transitions.get("schema") != "yaaw.transitions/v1":
        errors.append("transitions registry schema id drifted")

    state_schema = load_json(CORE / "schemas" / "project-state.schema.json")
    schema_states = set(
        state_schema["properties"]["tickets"]["additionalProperties"]["enum"]
    )
    transition_states = set(transitions.get("ticket_states", []))
    if transition_states != schema_states:
        errors.append(
            f"transition ticket states differ from project-state schema: "
            f"transitions={sorted(transition_states)} schema={sorted(schema_states)}"
        )

    legal_pairs = set()
    for transition in transitions.get("legal", []):
        pair = (transition.get("from"), transition.get("to"))
        if pair in legal_pairs:
            errors.append(f"duplicate legal transition {pair}")
        legal_pairs.add(pair)
        workflow = transition.get("workflow")
        if workflow not in workflows:
            errors.append(f"transition {pair} references unregistered workflow {workflow}")

    forbidden_pairs = {
        (entry.get("from"), entry.get("to"))
        for entry in transitions.get("forbidden", [])
    }
    if legal_pairs & forbidden_pairs:
        errors.append(
            f"transitions are both legal and forbidden: {sorted(legal_pairs & forbidden_pairs)}"
        )

    ids = [case.get("id") for case in fixtures.get("cases", [])]
    if len(ids) != len(set(ids)):
        errors.append("lifecycle fixture IDs must be unique")
    covered = {case_id.split("-", 1)[0] for case_id in ids if isinstance(case_id, str)}
    required = set("ABCDEFGHIJKLMNOPQ")
    if not required.issubset(covered):
        errors.append(f"lifecycle fixtures missing required cases {sorted(required - covered)}")

    errors.extend(run_fixture_cases(FIXTURES))

    fresh_root = ROOT / "tests" / "fixtures" / "fresh_context_project" / ".yaaw"
    for relative in (
        "product.md",
        "engineering.md",
        "state.json",
        "specs/SPEC-001.md",
        "tickets/TASK-001.md",
        "reviews/TASK-001-R1.md",
        "evidence/EVIDENCE-TASK-001-1.json",
    ):
        if not (fresh_root / relative).is_file():
            errors.append(f"fresh-context fixture missing {relative}")

    if not (ROOT / "scripts" / "init_project.py").is_file():
        errors.append("missing idempotent project bootstrap utility")

    if errors:
        print("YAAW behavioral validation failed:")
        for error in errors:
            print(f"- {error}")
        return 1

    print(
        f"YAAW behavioral validation passed: "
        f"{len(fixtures['cases'])} lifecycle cases, "
        f"{len(legal_pairs)} explicit legal transitions"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
