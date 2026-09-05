#!/usr/bin/env python3
"""Cross-file semantic validation for yaaw-SE policy, ownership, templates and routing."""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def load_json(path: str) -> dict:
    return json.loads((ROOT / path).read_text(encoding="utf-8"))


def headings(path: Path) -> set[str]:
    text = path.read_text(encoding="utf-8")
    return {m.group(1).strip() for m in re.finditer(r"^##\s+(.+?)\s*$", text, re.MULTILINE)}


def validate() -> list[str]:
    errors: list[str] = []
    catalog = load_json(".agents/catalog.json")
    router = load_json(".agents/router.json")
    artifacts = load_json(".agents/artifacts.json")
    authority = load_json(".agents/authority.json")
    ownership = load_json(".agents/ownership.json")
    controller_policy = load_json("config/controller-policy.json")

    agents = {a["id"] for a in catalog.get("agents", [])}
    skills = {s["id"]: s for s in catalog.get("skills", [])}

    for skill_id, skill in skills.items():
        if skill.get("owner") not in agents:
            errors.append(f"skill {skill_id} has unregistered owner {skill.get('owner')}")

    for shape in router.get("work_shapes", []):
        default_agents = set(shape.get("default_agents", []))
        default_skills = shape.get("default_skills", [])
        for role in default_agents:
            if role not in agents:
                errors.append(f"route {shape['id']} references unknown agent {role}")
        for skill_id in default_skills:
            if skill_id not in skills:
                errors.append(f"route {shape['id']} references unknown skill {skill_id}")
        if int(shape.get("default_level", shape.get("minimum_level", 0))) >= 2 and "qa" not in default_agents:
            errors.append(f"route {shape['id']} defaults to L2+ but omits qa from default_agents")

    context_budget_ref = router.get("context_budget_policy")
    if context_budget_ref != "config/context-budget.json":
        errors.append("router must register config/context-budget.json as context_budget_policy")
    elif not (ROOT / context_budget_ref).exists():
        errors.append("registered context budget policy does not exist")
    if router.get("principles", {}).get("token_budgeted_context") is not True:
        errors.append("router must require token_budgeted_context")

    budget_state = controller_policy.get("budget_state", {})
    if budget_state.get("path") != ".yaaw/runtime/budgets.json":
        errors.append("controller policy must persist aggregate usage at .yaaw/runtime/budgets.json")
    if budget_state.get("atomic_replace") is not True:
        errors.append("controller policy must require atomic budget-state replacement")
    if budget_state.get("survives_controller_restart") is not True:
        errors.append("controller policy must require budget state to survive controller restart")
    controller_budgets = controller_policy.get("budgets", {})
    for required_budget in ("max_agent_dispatches", "max_total_llm_calls", "max_total_llm_tokens"):
        if not isinstance(controller_budgets.get(required_budget), int) or controller_budgets[required_budget] < 1:
            errors.append(f"controller policy requires positive {required_budget}")

    artifact_types = {a["id"]: a for a in artifacts.get("artifact_types", [])}
    contracts = artifacts.get("contracts", {}).get("agents", {})
    for role, contract in contracts.items():
        if role not in agents:
            errors.append(f"artifact contract references unknown agent {role}")
            continue
        for artifact_id in contract.get("may_mutate", []):
            artifact = artifact_types.get(artifact_id)
            if artifact is None:
                errors.append(f"{role} may_mutate unknown artifact {artifact_id}")
            elif role not in artifact.get("allowed_mutators", []):
                errors.append(f"{role} may_mutate {artifact_id} but artifact disallows role")

    # Field authority may narrow an artifact's physical writer set, never expand it.
    for artifact_id, auth_spec in authority.get("artifacts", {}).items():
        artifact = artifact_types.get(artifact_id)
        if artifact is None:
            errors.append(f"authority policy references unknown artifact {artifact_id}")
            continue
        physical_mutators = set(artifact.get("allowed_mutators", []))
        fallback = set(auth_spec.get("fallback_mutators", []))
        for role in sorted(fallback - physical_mutators):
            errors.append(f"authority fallback grants {role} on {artifact_id} beyond artifact allowed_mutators")
        for field, field_spec in auth_spec.get("fields", {}).items():
            field_mutators = set(field_spec.get("mutators", []))
            for role in sorted(field_mutators - physical_mutators):
                errors.append(f"authority field grants {role} on {artifact_id}.{field} beyond artifact allowed_mutators")

    expected_sections = {
        "DISCOVERY_EVIDENCE": ("docs/templates/discovery-ticket.md", "Evidence"),
        "IMPLEMENTATION_HANDOFF": ("docs/templates/delivery-ticket.md", "Implementation evidence"),
        "QA_REPORT": ("docs/templates/delivery-ticket.md", "QA result"),
        "DELIVERY_RECORD": ("docs/templates/delivery-ticket.md", "Delivery"),
    }
    for artifact_id, (path, heading) in expected_sections.items():
        if artifact_id not in artifact_types:
            errors.append(f"missing core artifact {artifact_id}")
            continue
        if heading not in headings(ROOT / path):
            errors.append(f"{artifact_id} locator heading #{heading} missing from {path}")

    durable_template_ids = {
        "PRD": "yaaw.prd/v1",
        "SPEC": "yaaw.spec/v1",
        "INITIATIVE_MAP": "yaaw.initiative-map/v1",
        "PLAN_DELTA": "yaaw.plan-delta/v1",
        "ADR": "yaaw.adr/v1",
        "DISCOVERY_TICKET": "yaaw.ticket/v1",
        "DECISION_TICKET": "yaaw.ticket/v1",
        "DELIVERY_TICKET": "yaaw.ticket/v1",
    }
    for artifact_id, expected_schema in durable_template_ids.items():
        artifact = artifact_types.get(artifact_id)
        if not artifact or not artifact.get("template"):
            errors.append(f"{artifact_id} lacks registered template")
            continue
        text = (ROOT / artifact["template"]).read_text(encoding="utf-8")
        if not text.startswith("---yaaw-json"):
            errors.append(f"{artifact_id} template is not structured")
        if f'"schema": "{expected_schema}"' not in text and f'"schema":"{expected_schema}"' not in text:
            errors.append(f"{artifact_id} template schema is not {expected_schema}")

    from yaaw.ownership import OwnershipRule, validate_rules, resolve
    rules = []
    for entry in ownership.get("entries", []):
        co = entry.get("co_owners")
        if co is None and entry.get("co_owner"):
            co = [entry["co_owner"]]
        rules.append(OwnershipRule(pattern=entry["pattern"], owner=entry["owner"], co_owners=tuple(co or []), deny=bool(entry.get("deny", False))))
    errors.extend(validate_rules(rules))
    for critical_path in (
        "AGENTS.md", "README.md", ".gitignore",
        "scripts/yaaw/controller.py", "scripts/yaaw/budgets.py", "scripts/yaaw/security.py", "scripts/yaaw/runtime_gateway.py",
        "scripts/yaaw/context.py", "scripts/yaaw/retrieval.py", "scripts/yaaw/token_budget.py",
        "scripts/yaaw/workload_evidence.py", "scripts/yaaw/workload_manifest.py",
        "scripts/run_evals.py", "scripts/run_agent_evals.py", "scripts/run_workload_compare.py",
        "scripts/create_external_workload.py", "scripts/report_metrics.py",
        "config/controller-policy.json", "config/runtime-adapters.json", "config/generic-command-runtime.json", "config/context-budget.json",
        ".agents/schemas/ticket.schema.json", ".agents/schemas/context-budget.schema.json", "tests/harness/test_graph.py",
    ):
        if resolve(critical_path, rules, ownership.get("default_owner", "UNKNOWN_OWNER")).owner == "UNKNOWN_OWNER":
            errors.append(f"core harness path has UNKNOWN_OWNER: {critical_path}")

    for schema_path in sorted((ROOT / ".agents/schemas").glob("*.json")):
        try:
            schema = json.loads(schema_path.read_text(encoding="utf-8"))
        except json.JSONDecodeError as exc:
            errors.append(f"invalid schema JSON {schema_path.relative_to(ROOT)}: {exc}")
            continue
        if schema.get("$schema") != "https://json-schema.org/draft/2020-12/schema":
            errors.append(f"{schema_path.relative_to(ROOT)} does not declare JSON Schema 2020-12")
        if not schema.get("$id"):
            errors.append(f"{schema_path.relative_to(ROOT)} lacks $id")

    overview = (ROOT / "docs/workflow/overview.md").read_text(encoding="utf-8")
    delivery_doc = (ROOT / "docs/workflow/delivery.md").read_text(encoding="utf-8")
    release_role = (ROOT / ".agents/agents/release-engineer.md").read_text(encoding="utf-8")
    if "Release / integration semantics?" not in overview or "REL --> COMMIT" not in overview:
        errors.append("workflow overview does not model conditional Release Engineer admission before material commit/integration")
    if "QR -->|PASS| COMMIT" in overview or "COMMIT --> MSG" in overview:
        errors.append("workflow overview retains pre-Release-Engineer material commit ordering")
    if "release_engineer_required" not in delivery_doc:
        errors.append("delivery docs do not describe executable conditional Release Engineer policy")
    if "Do not add ceremony to trivial local work" not in release_role:
        errors.append("Release Engineer role lost trivial-local-work exclusion")

    # Cold-start root policy must point agents at executable enforcement and bounded context.
    root_policy = (ROOT / "AGENTS.md").read_text(encoding="utf-8")
    for required_phrase in (
        ".agents/authority.json",
        "deterministic controller",
        "controller admission",
        "untrusted data",
        "release_engineer_required",
        "RuntimeGateway",
        "UNPROVEN",
        "config/context-budget.json",
        "yaaw context",
    ):
        if required_phrase not in root_policy:
            errors.append(f"AGENTS.md cold-start contract missing {required_phrase!r}")

    gateway_source = (ROOT / "scripts/yaaw/runtime_gateway.py").read_text(encoding="utf-8")
    for required_phrase in ("_ticket_scope", "missing durable allowed_write scope", "requires explicit affected paths"):
        if required_phrase not in gateway_source:
            errors.append(f"runtime gateway lost ticket-bound scope invariant {required_phrase!r}")

    context_source = (ROOT / "scripts/yaaw/context.py").read_text(encoding="utf-8")
    for required_phrase in ("_pack_retrieval", "ContextBudgetExceeded", "from_repository", "omitted_retrieval"):
        if required_phrase not in context_source:
            errors.append(f"context builder lost token-packing invariant {required_phrase!r}")

    retrieval_source = (ROOT / "scripts/yaaw/retrieval.py").read_text(encoding="utf-8")
    for required_phrase in ("LocalRetrievalRuntime", "plan_retrieval_for_ticket", "git", "max_chars_per_result"):
        if required_phrase not in retrieval_source:
            errors.append(f"retrieval runtime lost bounded-live-retrieval invariant {required_phrase!r}")

    budget_source = (ROOT / "scripts/yaaw/budgets.py").read_text(encoding="utf-8")
    for required_phrase in ("from_policy", "yaaw.budget-state/v1", "os.replace", "state_path"):
        if required_phrase not in budget_source:
            errors.append(f"budget subsystem lost persisted aggregate-state invariant {required_phrase!r}")

    controller_source = (ROOT / "scripts/yaaw/controller.py").read_text(encoding="utf-8")
    for required_phrase in ("from_repository", "admit_agent_invocation", "reserve_llm_tokens", "max_total_llm_tokens", "max_total_llm_calls"):
        if required_phrase not in controller_source:
            errors.append(f"controller lost aggregate model budget invariant {required_phrase!r}")

    eval_source = (ROOT / "scripts/yaaw/agent_eval.py").read_text(encoding="utf-8")
    for required_phrase in ("max_total_tokens", "tokens_per_passing_trial", "max_total_cost_usd", "max_total_duration_ms"):
        if required_phrase not in eval_source:
            errors.append(f"agent eval lost resource threshold invariant {required_phrase!r}")

    evidence_source = (ROOT / "scripts/yaaw/workload_evidence.py").read_text(encoding="utf-8")
    for required_phrase in ("manifest_fingerprint", "_manifest_matches", '"EMPIRICAL"', "token_reduction_ratio", "quality_non_regression"):
        if required_phrase not in evidence_source:
            errors.append(f"workload evidence lost empirical/efficiency invariant {required_phrase!r}")

    return sorted(set(errors))


def main() -> int:
    errors = validate()
    if errors:
        for error in errors:
            print(f"ERROR: {error}")
        return 1
    print("OK: semantic policy validation passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
