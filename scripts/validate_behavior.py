#!/usr/bin/env python3
"""Validate machine-readable YAAW behavioral contracts and lifecycle fixtures."""
from __future__ import annotations
import json
from pathlib import Path
from behavior_oracle import run_fixture_cases

ROOT=Path(__file__).resolve().parents[1]
CORE=ROOT/".yaaw-core"
FIXTURES=ROOT/"tests"/"fixtures"/"lifecycle_cases.json"
def load_json(path:Path): return json.loads(path.read_text(encoding="utf-8"))

def main()->int:
    workflows=load_json(CORE/"registries"/"workflows.json")
    policy=load_json(CORE/"registries"/"routing-policy.json")
    execution=load_json(CORE/"registries"/"execution-policy.json")
    transitions=load_json(CORE/"registries"/"transitions.json")
    fixtures=load_json(FIXTURES)
    errors=[]
    if policy.get("schema")!="yaaw.routing-policy/v2": errors.append("routing-policy schema id drifted")
    if transitions.get("schema")!="yaaw.transitions/v2": errors.append("transitions registry schema id drifted")
    if set(execution.get("workflows",{}))!=set(workflows): errors.append("execution-policy must cover every registered workflow exactly once")
    expected=[("REPLAN_REQUIRED","planning.replan"),("REPAIR_REQUIRED","implementation.repair-ticket"),("REVIEW_REQUIRED","review.review-ticket"),("IN_PROGRESS","orchestration.recover-interruption"),("READY","implementation.implement-ticket")]
    actual=[(x.get("state"),x.get("workflow")) for x in policy.get("ticket_state_precedence",[])]
    if actual!=expected: errors.append(f"routing precedence drifted: {actual!r}")
    contract={"PRODUCT_SOURCE_STALE","ENGINEERING_SOURCE_STALE","SPEC_SOURCE_STALE","TICKET_SOURCE_STALE","CONTRACT_INVALIDATED"}
    acceptance={"REVIEW_MISSING","REVIEW_REPOSITORY_STALE","VERIFICATION_MISSING","VERIFICATION_REPOSITORY_STALE","LEGACY_IDENTITY_UNVERIFIABLE"}
    routes=policy.get("invalidation_routes",{})
    if set(routes)!=(contract|acceptance): errors.append("invalidation routing cause vocabulary drifted")
    for cause in contract:
        if routes.get(cause)!={"state":"REPLAN_REQUIRED","workflow":"planning.replan"}: errors.append(f"{cause} must route to planning.replan")
    for cause in acceptance:
        if routes.get(cause)!={"state":"REVIEW_REQUIRED","workflow":"review.review-ticket"}: errors.append(f"{cause} must route to review.review-ticket")
    state_schema=load_json(CORE/"schemas"/"project-state.schema.json")
    if set(transitions["ticket_states"])!=set(state_schema["properties"]["tickets"]["additionalProperties"]["enum"]): errors.append("transition ticket states differ from project-state schema")
    legal=set()
    for t in transitions.get("legal",[]):
        pair=(t.get("from"),t.get("to"))
        if pair in legal: errors.append(f"duplicate legal transition {pair}")
        legal.add(pair)
        if t.get("workflow") not in workflows: errors.append(f"transition {pair} references unregistered workflow {t.get('workflow')}")
        if t.get("state_writer") != "orchestrator": errors.append(f"transition {pair} must use orchestrator as physical state writer")
    for pair in {("PASS","REVIEW_REQUIRED"),("PASS","REPLAN_REQUIRED")}:
        if pair not in legal: errors.append(f"missing required invalidation transition {pair}")
    forbidden={(x.get("from"),x.get("to")) for x in transitions.get("forbidden",[])}
    if legal&forbidden: errors.append(f"transitions both legal and forbidden: {sorted(legal&forbidden)}")
    ids=[c.get("id") for c in fixtures.get("cases",[])]
    if len(ids)!=len(set(ids)): errors.append("lifecycle fixture IDs must be unique")
    if not set("ABCDEFGHIJKLMNOPQRSTUVWXYZ").issubset({i.split("-",1)[0] for i in ids if isinstance(i,str)}): errors.append("lifecycle fixtures missing A-Z coverage")
    errors.extend(run_fixture_cases(FIXTURES))
    fresh=ROOT/"tests"/"fixtures"/"fresh_context_project"/".yaaw-core"/"project"
    for rel in ("product.md","engineering.md","state.json","specs/SPEC-001.md","tickets/TASK-001.md","reviews/TASK-001-R1.md","evidence/EVIDENCE-TASK-001-V1.json"):
        if not (fresh/rel).is_file(): errors.append(f"fresh-context fixture missing {rel}")
    if not (ROOT/"scripts"/"init_project.py").is_file(): errors.append("missing idempotent project bootstrap utility")
    if errors:
        print("YAAW behavioral validation failed:")
        for e in errors: print(f"- {e}")
        return 1
    print(f"YAAW behavioral validation passed: {len(fixtures['cases'])} lifecycle cases, {len(legal)} explicit legal transitions")
    return 0
if __name__=="__main__": raise SystemExit(main())
