#!/usr/bin/env python3
"""Deterministic conformance oracle for YAAW routing/recovery tests."""
from __future__ import annotations
import argparse, copy, json
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
CORE = ROOT / ".yaaw-core" / "system"
DEFAULT_POLICY = CORE / "registries" / "routing-policy.json"
DEFAULT_EXECUTION_POLICY = CORE / "registries" / "execution-policy.json"

def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))

def _change(ticket_id: str, from_state: str, to_state: str, reason: str) -> dict[str, str]:
    return {"ticket": ticket_id, "from": from_state, "to": to_state, "reason": reason}

def reconcile_observed(observed: dict[str, Any]) -> tuple[dict[str, Any], list[dict[str, str]]]:
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
            changes.append(_change(ticket_id, "IN_PROGRESS", "REVIEW_REQUIRED", "IMPLEMENTATION_VERIFIED_NOT_REVIEWED"))
            continue

        if state == "READY" and implementation:
            next_state = "REVIEW_REQUIRED" if verification_present else "IN_PROGRESS"
            ticket["state"] = next_state
            changes.append(_change(ticket_id, "READY", next_state, "IMPLEMENTATION_ALREADY_PRESENT"))
    return current, changes

def _determine_next_unchecked(observed: dict[str, Any], policy: dict[str, Any]) -> dict[str, Any]:
    reconciled, changes = reconcile_observed(observed)
    if not reconciled.get("state_consistent", True) and not reconciled.get("recovery_evidence_sufficient", True):
        return {"workflow":"orchestration.recover-interruption","terminal":None,"reconciliations":changes}
    if reconciled.get("blocker"):
        return {"workflow":None,"terminal":"BLOCKED","reconciliations":changes}
    if reconciled.get("product_status","missing") != "ready":
        return {"workflow":policy["product_unready_workflow"],"terminal":None,"reconciliations":changes}
    tickets = reconciled.get("tickets", {})
    for rule in policy["ticket_state_precedence"]:
        if rule["state"] == "REPLAN_REQUIRED" and any(t["state"]=="REPLAN_REQUIRED" for t in tickets.values()):
            return {"workflow":rule["workflow"],"terminal":None,"reconciliations":changes}
    if reconciled.get("planning_status","missing") != "ready" or reconciled.get("readiness","pending") != "PASS":
        return {"workflow":policy["planning_unready_workflow"],"terminal":None,"reconciliations":changes}
    if reconciled.get("spec_status","missing") != "accepted":
        return {"workflow":policy["missing_spec_workflow"],"terminal":None,"reconciliations":changes}
    if not tickets:
        return {"workflow":policy["missing_tickets_workflow"],"terminal":None,"reconciliations":changes}
    for rule in policy["ticket_state_precedence"]:
        if rule["state"] == "REPLAN_REQUIRED":
            continue
        candidates=[(i,t) for i,t in sorted(tickets.items()) if t["state"]==rule["state"]]
        if rule["state"]=="READY":
            candidates=[(i,t) for i,t in candidates if t.get("dependencies_satisfied",False)]
        if candidates:
            return {"workflow":rule["workflow"],"terminal":None,"ticket":candidates[0][0],"reconciliations":changes}
    if tickets and all(t["state"] in {"PASS","CANCELLED"} for t in tickets.values()):
        if reconciled.get("accepted_scope_remaining",False):
            return {"workflow":policy["next_frontier_workflow"],"terminal":None,"reconciliations":changes}
        return {"workflow":None,"terminal":policy["complete_terminal"],"reconciliations":changes}
    if any(t["state"]=="BLOCKED" for t in tickets.values()):
        return {"workflow":None,"terminal":"BLOCKED","reconciliations":changes}
    return {"workflow":"orchestration.recover-interruption","terminal":None,"reconciliations":changes}

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
        if requirement == "IDENTITY" and observed.get("repository_status","READY") != "READY":
            return {"workflow":None,"terminal":"BLOCKED","reason":"REPOSITORY_IDENTITY_UNAVAILABLE","reconciliations":result.get("reconciliations",[])}
    return result

def run_fixture_cases(fixtures_path: Path, policy_path: Path = DEFAULT_POLICY) -> list[str]:
    policy=load_json(policy_path)
    failures=[]
    for case in load_json(fixtures_path)["cases"]:
        actual=determine_next(case["observed"],policy)
        expected=case["expected"]
        for key in ("workflow","terminal"):
            if actual.get(key)!=expected.get(key):
                failures.append(f'{case["id"]}: expected {key}={expected.get(key)!r}, got {actual.get(key)!r}; actual={actual}')
        if "reconciliations" in expected:
            actual_rows=[(x["ticket"],x["from"],x["to"],x.get("reason")) for x in actual.get("reconciliations",[])]
            wanted_rows=[(x["ticket"],x["from"],x["to"],x.get("reason")) for x in expected["reconciliations"]]
            if actual_rows!=wanted_rows:
                failures.append(f'{case["id"]}: expected reconciliations={wanted_rows!r}, got {actual_rows!r}')
    return failures

def main() -> int:
    parser=argparse.ArgumentParser()
    parser.add_argument("--fixtures",type=Path,default=ROOT/"tests"/"fixtures"/"lifecycle_cases.json")
    parser.add_argument("--policy",type=Path,default=DEFAULT_POLICY)
    args=parser.parse_args()
    failures=run_fixture_cases(args.fixtures,args.policy)
    if failures:
        print("YAAW behavioral conformance failed:")
        for failure in failures: print(f"- {failure}")
        return 1
    print(f"YAAW behavioral conformance passed: {len(load_json(args.fixtures)['cases'])} lifecycle cases")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
