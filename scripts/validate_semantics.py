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
        rules.append(OwnershipRule(
            pattern=entry["pattern"],
            owner=entry["owner"],
            co_owners=tuple(co or []),
            deny=bool(entry.get("deny", False)),
        ))
    errors.extend(validate_rules(rules))
    for critical_path in (
        "scripts/yaaw/controller.py",
        "scripts/yaaw/security.py",
        ".agents/schemas/ticket.schema.json",
        "tests/harness/test_graph.py",
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

    # The workflow overview must not place a coherent material commit before the
    # conditional Release Engineer admission; that would contradict the role contract.
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
