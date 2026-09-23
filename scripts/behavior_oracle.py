#!/usr/bin/env python3
"""Deterministic conformance oracle for YAAW routing/recovery tests.

This is validation infrastructure, not the runtime workflow engine. Runtime behavior
remains defined by .yaaw-core contracts; this oracle makes those contracts testable.
"""
from __future__ import annotations

import argparse
import copy
import json
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
CORE = ROOT / ".yaaw-core" / "system"
DEFAULT_POLICY = CORE / "registries" / "routing-policy.json"
DEFAULT_EXECUTION_POLICY = CORE / "registries" / "execution-policy.json"


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def reconcile_observed(observed: dict[str, Any]) -> tuple[dict[str, Any], list[dict[str, str]]]:
    """Apply only recovery rules that are safe from the fixture's explicit evidence."""
    current = copy.deepcopy(observed)
    changes: list[dict[str, str]] = []
    for ticket_id, ticket in current.get("tickets", {}).items():
        state = ticket["state"]
        source_current = ticket.get("source_current", True)
        implementation = ticket.get("implementation_present", False)
        verification = ticket.get("verification_present", False)
        legacy_fresh_review = ticket.get("fresh_review")
        review_present = ticket.get("review_present", bool(legacy_fresh_review))
        review_source_current = ticket.get("review_source_current", source_current)
        review_repository_current = ticket.get("review_repository_current", bool(legacy_fresh_review))
        verification_repository_current = ticket.get("verification_repository_current", verification)
        identity_verifiable = ticket.get("identity_verifiable", True)

        if state == "PASS":
            if not source_current or not review_source_current:
                ticket["state"] = "REPLAN_REQUIRED"
                changes.append({"ticket": ticket_id, "from": "PASS", "to": "REPLAN_REQUIRED", "reason": "TICKET_SOURCE_STALE"})
                continue
            if not review_present:
                ticket["state"] = "REVIEW_REQUIRED"
                changes.append({"ticket": ticket_id, "from": "PASS", "to": "REVIEW_REQUIRED", "reason": "REVIEW_MISSING"})
                continue
            if not identity_verifiable:
                ticket["state"] = "REVIEW_REQUIRED"
                changes.append({"ticket": ticket_id, "from": "PASS", "to": "REVIEW_REQUIRED", "reason": "LEGACY_IDENTITY_UNVERIFIABLE"})
                continue
            if not review_repository_current:
                ticket["state"] = "REVIEW_REQUIRED"
                changes.append({"ticket": ticket_id, "from": "PASS", "to": "REVIEW_REQUIRED", "reason": "REVIEW_REPOSITORY_STALE"})
                continue
            if not verification:
                ticket["state"] = "REVIEW_REQUIRED"
                changes.append({"ticket": ticket_id, "from": "PASS", "to": "REVIEW_REQUIRED", "reason": "VERIFICATION_MISSING"})
                continue
            if not verification_repository_current:
                ticket["state"] = "REVIEW_REQUIRED"
                changes.append({"ticket": ticket_id, "from": "PASS", "to": "REVIEW_REQUIRED", "reason": "VERIFICATION_REPOSITORY_STALE"})
                continue

        if state == "IN_PROGRESS" and implementation and verification and not review_repository_current:
            ticket["state"] = "REVIEW_REQUIRED"
            changes.append({
                "ticket": ticket_id,
                "from": "IN_PROGRESS",
                "to": "REVIEW_REQUIRED",
                "reason": "implementation and verification exist but fresh acceptance does not",
            })
            continue

        if state == "READY" and implementation:
            next_state = "REVIEW_REQUIRED" if verification else "IN_PROGRESS"
            ticket["state"] = next_state
            changes.append({
                "ticket": ticket_id,
                "from": "READY",
                "to": next_state,
                "reason": "repository evidence proves work already started",
            })

    return current, changes


def _determine_next_unchecked(observed: dict[str, Any], policy: dict[str, Any]) -> dict[str, Any]:
    """Return one canonical workflow or terminal state after safe reconciliation."""
    reconciled, changes = reconcile_observed(observed)

    if not reconciled.get("state_consistent", True):
        if not reconciled.get("recovery_evidence_sufficient", True):
            return {
                "workflow": "orchestration.recover-interruption",
                "terminal": None,
                "reconciliations": changes,
            }

    if reconciled.get("blocker"):
        return {"workflow": None, "terminal": "BLOCKED", "reconciliations": changes}

    if reconciled.get("product_status", "missing") != "ready":
        return {
            "workflow": policy["product_unready_workflow"],
            "terminal": None,
            "reconciliations": changes,
        }

    tickets = reconciled.get("tickets", {})

    # REPLAN is intentionally checked before general planning readiness.
    for state_rule in policy["ticket_state_precedence"]:
        state = state_rule["state"]
        if state != "REPLAN_REQUIRED":
            continue
        if any(ticket["state"] == state for ticket in tickets.values()):
            return {"workflow": state_rule["workflow"], "terminal": None, "reconciliations": changes}

    if (
        reconciled.get("planning_status", "missing") != "ready"
        or reconciled.get("readiness", "pending") != "PASS"
    ):
        return {
            "workflow": policy["planning_unready_workflow"],
            "terminal": None,
            "reconciliations": changes,
        }

    if reconciled.get("spec_status", "missing") != "accepted":
        return {
            "workflow": policy["missing_spec_workflow"],
            "terminal": None,
            "reconciliations": changes,
        }

    if not tickets:
        return {
            "workflow": policy["missing_tickets_workflow"],
            "terminal": None,
            "reconciliations": changes,
        }

    for state_rule in policy["ticket_state_precedence"]:
        state = state_rule["state"]
        if state == "REPLAN_REQUIRED":
            continue
        candidates = [
            (ticket_id, ticket)
            for ticket_id, ticket in sorted(tickets.items())
            if ticket["state"] == state
        ]
        if state == "READY":
            candidates = [
                (ticket_id, ticket)
                for ticket_id, ticket in candidates
                if ticket.get("dependencies_satisfied", False)
            ]
        if candidates:
            return {
                "workflow": state_rule["workflow"],
                "terminal": None,
                "ticket": candidates[0][0],
                "reconciliations": changes,
            }

    if tickets and all(ticket["state"] in {"PASS", "CANCELLED"} for ticket in tickets.values()):
        if reconciled.get("accepted_scope_remaining", False):
            return {
                "workflow": policy["next_frontier_workflow"],
                "terminal": None,
                "reconciliations": changes,
            }
        return {
            "workflow": None,
            "terminal": policy["complete_terminal"],
            "reconciliations": changes,
        }

    if any(ticket["state"] == "BLOCKED" for ticket in tickets.values()):
        return {"workflow": None, "terminal": "BLOCKED", "reconciliations": changes}

    return {
        "workflow": "orchestration.recover-interruption",
        "terminal": None,
        "reconciliations": changes,
    }


def determine_next(observed: dict[str, Any], policy: dict[str, Any]) -> dict[str, Any]:
    """Fail closed on framework integrity, then route and enforce repository requirements."""
    framework_status = observed.get("framework_status", "HEALTHY")
    if framework_status != "HEALTHY":
        if framework_status == "CONTRACT_INCONSISTENT":
            reason = "FRAMEWORK_CONTRACT_INCONSISTENCY"
        elif framework_status in {"UNKNOWN", "MANIFEST_INVALID"}:
            reason = "FRAMEWORK_INTEGRITY_UNKNOWN"
        else:
            reason = "FRAMEWORK_INTEGRITY_VIOLATION"
        return {"workflow": None, "terminal": "BLOCKED", "reason": reason, "reconciliations": []}

    result = _determine_next_unchecked(observed, policy)
    workflow = result.get("workflow")
    if workflow:
        execution = load_json(DEFAULT_EXECUTION_POLICY)
        requirement = execution["workflows"][workflow]["repository_requirement"]
        repository_status = observed.get("repository_status", "READY")
        if requirement == "IDENTITY" and repository_status != "READY":
            return {
                "workflow": None,
                "terminal": "BLOCKED",
                "reason": "REPOSITORY_IDENTITY_UNAVAILABLE",
                "reconciliations": result.get("reconciliations", []),
            }
    return result


def run_fixture_cases(fixtures_path: Path, policy_path: Path = DEFAULT_POLICY) -> list[str]:
    policy = load_json(policy_path)
    cases = load_json(fixtures_path)["cases"]
    failures: list[str] = []
    for case in cases:
        actual = determine_next(case["observed"], policy)
        expected = case["expected"]
        for key in ("workflow", "terminal"):
            if actual.get(key) != expected.get(key):
                failures.append(
                    f'{case["id"]}: expected {key}={expected.get(key)!r}, '
                    f'got {actual.get(key)!r}; actual={actual}'
                )
        expected_changes = expected.get("reconciliations")
        if expected_changes is not None:
            actual_pairs = [
                (change["ticket"], change["from"], change["to"])
                for change in actual.get("reconciliations", [])
            ]
            wanted_pairs = [
                (change["ticket"], change["from"], change["to"])
                for change in expected_changes
            ]
            if actual_pairs != wanted_pairs:
                failures.append(
                    f'{case["id"]}: expected reconciliations={wanted_pairs!r}, '
                    f'got {actual_pairs!r}'
                )
    return failures


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--fixtures",
        type=Path,
        default=ROOT / "tests" / "fixtures" / "lifecycle_cases.json",
    )
    parser.add_argument("--policy", type=Path, default=DEFAULT_POLICY)
    args = parser.parse_args()

    failures = run_fixture_cases(args.fixtures, args.policy)
    if failures:
        print("YAAW behavioral conformance failed:")
        for failure in failures:
            print(f"- {failure}")
        return 1

    case_count = len(load_json(args.fixtures)["cases"])
    print(f"YAAW behavioral conformance passed: {case_count} lifecycle cases")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
