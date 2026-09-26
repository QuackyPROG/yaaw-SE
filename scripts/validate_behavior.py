#!/usr/bin/env python3
"""Validate machine-readable YAAW behavioral contracts and lifecycle fixtures."""
from __future__ import annotations

import json
from pathlib import Path

import subprocess

ROOT = Path(__file__).resolve().parents[1]
CORE = ROOT / ".yaaw-core" / "system"
FIXTURES = ROOT / "tests" / "fixtures" / "lifecycle_cases.json"


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def main() -> int:
    workflows = load_json(CORE / "registries" / "workflows.json")
    policy = load_json(CORE / "registries" / "routing-policy.json")
    execution = load_json(CORE / "registries" / "execution-policy.json")
    transitions = load_json(CORE / "registries" / "transitions.json")
    fixtures = load_json(FIXTURES)
    errors: list[str] = []

    if policy.get("schema") != "yaaw.routing-policy/v1":
        errors.append("routing-policy schema id drifted")
    if transitions.get("schema") != "yaaw.transitions/v1":
        errors.append("transitions registry schema id drifted")
    if set(execution.get("workflows", {})) != set(workflows):
        errors.append("execution-policy must cover every registered workflow exactly once")

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

    contract_causes = {
        "PRODUCT_SOURCE_STALE",
        "ENGINEERING_SOURCE_STALE",
        "SPEC_SOURCE_STALE",
        "TICKET_SOURCE_STALE",
        "CONTRACT_INVALIDATED",
    }
    acceptance_causes = {
        "REVIEW_MISSING",
        "REVIEW_REPOSITORY_STALE",
        "VERIFICATION_MISSING",
        "VERIFICATION_REPOSITORY_STALE",
        "LEGACY_IDENTITY_UNVERIFIABLE",
    }
    routes = policy.get("invalidation_routes", {})
    if set(routes) != contract_causes | acceptance_causes:
        errors.append("invalidation routing cause vocabulary drifted")
    for cause in contract_causes:
        if routes.get(cause) != {"state": "REPLAN_REQUIRED", "workflow": "planning.replan"}:
            errors.append(f"{cause} must route to planning.replan")
    for cause in acceptance_causes:
        if routes.get(cause) != {"state": "REVIEW_REQUIRED", "workflow": "review.review-ticket"}:
            errors.append(f"{cause} must route to review.review-ticket")

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

    state_schema = load_json(CORE / "schemas" / "project-state.schema.json")
    schema_states = set(state_schema["properties"]["tickets"]["additionalProperties"]["enum"])
    transition_states = set(transitions.get("ticket_states", []))
    if transition_states != schema_states:
        errors.append(
            "transition ticket states differ from project-state schema: "
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
        if transition.get("state_writer") != "orchestrator":
            errors.append(f"transition {pair} must use orchestrator as physical state writer")

    for pair in {("PASS", "REVIEW_REQUIRED"), ("PASS", "REPLAN_REQUIRED")}:
        if pair not in legal_pairs:
            errors.append(f"missing required PASS recovery transition {pair}")

    for transition in transitions.get("legal", []):
        if transition.get("from") != "PASS" or not transition.get("causes"):
            continue
        for cause in transition["causes"]:
            route = routes.get(cause)
            if not route:
                errors.append(f"PASS recovery cause {cause} has no routing policy entry")
            elif route.get("state") != transition.get("to"):
                errors.append(
                    f"PASS recovery cause {cause} routes to {route.get('state')} "
                    f"but transition requires {transition.get('to')}"
                )

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

    # Keep coverage tied to actual semantic scenarios, not arbitrary alphabet completion.
    required_prefixes = set("ABCDEFGHIJKLMNOP")
    covered = {
        case_id.split("-", 1)[0]
        for case_id in ids
        if isinstance(case_id, str)
    }
    if not required_prefixes.issubset(covered):
        errors.append(
            f"lifecycle fixtures missing required cases {sorted(required_prefixes - covered)}"
        )

    oracle = (ROOT / "scripts" / "behavior_oracle.py").read_text(encoding="utf-8")
    if "def determine_next" in oracle or "ticket_state_precedence" in oracle:
        errors.append("behavior_oracle.py must not contain an independent lifecycle router")
    result = subprocess.run(["node", "scripts/run_lifecycle_cases.mjs"], cwd=ROOT, capture_output=True, text=True)
    if result.returncode != 0:
        errors.append("production lifecycle fixtures failed: " + (result.stderr or result.stdout).strip())

    fresh = ROOT / "tests" / "fixtures" / "fresh_context_project" / ".yaaw-core" / "project"
    for rel in (
        "product.md",
        "engineering.md",
        "state.json",
        "specs/SPEC-001.md",
        "tickets/TASK-001.md",
        "reviews/TASK-001-R1.md",
        "evidence/EVIDENCE-TASK-001-V1.json",
    ):
        if not (fresh / rel).is_file():
            errors.append(f"fresh-context fixture missing {rel}")

    if not (ROOT / "scripts" / "init_project.py").is_file():
        errors.append("missing idempotent project bootstrap utility")

    if errors:
        print("YAAW behavioral validation failed:")
        for error in errors:
            print(f"- {error}")
        return 1

    print(
        f"YAAW behavioral validation passed: {len(fixtures['cases'])} lifecycle cases, "
        f"{len(legal_pairs)} explicit legal transitions"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
