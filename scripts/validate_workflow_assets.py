#!/usr/bin/env python3
"""Validate yaaw-SE v2 skills, authority roles, ownership and artifact contracts."""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def load_json(path: str):
    with (ROOT / path).open("r", encoding="utf-8") as handle:
        return json.load(handle)


def require(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(f"ERROR: {message}")


def main() -> None:
    router = load_json(".agents/router.json")
    catalog = load_json(".agents/catalog.json")
    ownership = load_json(".agents/ownership.json")
    artifacts = load_json(".agents/artifacts.json")

    require(router.get("catalog") == ".agents/catalog.json", "router catalog pointer mismatch")
    require(router.get("ownership") == ".agents/ownership.json", "router ownership pointer mismatch")
    require(router.get("artifacts") == ".agents/artifacts.json", "router artifact-registry pointer mismatch")
    require(catalog.get("artifact_registry") == ".agents/artifacts.json", "catalog artifact-registry pointer mismatch")
    require(ownership.get("artifact_registry") == ".agents/artifacts.json", "ownership artifact-registry pointer mismatch")
    require(set(router.get("levels", {})) == {"0", "1", "2", "3", "4"}, "router must define exactly L0-L4")
    require(router.get("ticket_kinds") == ["DISCOVERY", "DECISION", "DELIVERY"], "ticket kind contract changed")
    require("agents" not in catalog, "named agent registry must not exist in v2 catalog")
    require("agents" not in artifacts.get("contracts", {}), "named agent artifact contracts must not exist")
    require(not (ROOT / ".agents/agents").exists(), ".agents/agents must be absent in v2")
    require(not (ROOT / ".codex/agents").exists(), ".codex/agents must be absent in v2")

    expected_delta_actions = {"CONTINUE","AMEND_UNRESOLVED","SPLIT","INSERT_PREREQUISITE","ADD_FOLLOWUP","ADD_DISCOVERY","ADD_DECISION","RESEQUENCE","PROMOTE_LEVEL","SUPERSEDE_UNRESOLVED","CORRECT_COMPLETED_WORK"}
    require(set(router.get("plan_delta", {}).get("actions", [])) == expected_delta_actions, "PLAN_DELTA action set is incomplete or changed")
    require(router.get("plan_delta", {}).get("completed_history_rewrite_forbidden") is True, "completed-history invariant must remain explicit")

    role_items = catalog.get("authority_roles", [])
    roles = {item["id"]: item for item in role_items}
    skills = {item["id"]: item for item in catalog.get("skills", [])}
    rules = {item["id"]: item for item in catalog.get("rules", [])}
    require(len(roles) == len(role_items), "duplicate authority role ids")
    require(len(skills) == len(catalog.get("skills", [])), "duplicate skill ids")
    require(len(rules) == len(catalog.get("rules", [])), "duplicate rule ids")
    require(set(skills) == {"yaaw-prd","yaaw-orchestrator","yaaw-planner","yaaw-implement","yaaw-review"}, "v2 public skill surface must remain exactly five skills")

    for collection_name, collection in (("skill", skills), ("rule", rules)):
        for asset_id, asset in collection.items():
            path = asset.get("path")
            require(path and (ROOT / path).is_file(), f"registered {collection_name} {asset_id} missing at {path}")

    for skill_id, skill in skills.items():
        require(skill.get("owner") in roles, f"skill {skill_id} has unknown authority role {skill.get('owner')}")

    for item in catalog.get("validation", []):
        require((ROOT / item["path"]).is_file(), f"validation asset missing: {item['path']}")

    for shape in router.get("work_shapes", []):
        require("default_agents" not in shape, f"work shape {shape['id']} must not declare named agents")
        for skill in shape.get("default_skills", []):
            require(skill in skills, f"work shape {shape['id']} references unknown skill {skill}")

    valid_owners = set(roles) | {"UNKNOWN_OWNER"}
    for entry in ownership.get("entries", []):
        require(entry.get("owner") in valid_owners, f"ownership pattern {entry.get('pattern')} has unknown owner")
        co_owner = entry.get("co_owner")
        require(co_owner is None or co_owner in roles, f"ownership pattern {entry.get('pattern')} has unknown co-owner")

    artifact_types = {item["id"]: item for item in artifacts.get("artifact_types", [])}
    require(len(artifact_types) == len(artifacts.get("artifact_types", [])), "duplicate artifact type ids")
    special_owners = set(artifacts.get("special_owners", []))
    for artifact_id, artifact in artifact_types.items():
        require(artifact.get("owner") in valid_owners | special_owners, f"artifact {artifact_id} has unknown owner {artifact.get('owner')}")
        require(artifact.get("storage_kind"), f"artifact {artifact_id} missing storage_kind")
        require(artifact.get("canonical_locator"), f"artifact {artifact_id} missing canonical_locator")
        for role in artifact.get("allowed_producers", []) + artifact.get("allowed_mutators", []):
            require(role in roles, f"artifact {artifact_id} references unknown authority role {role}")
        template = artifact.get("template")
        require(template is None or (ROOT / template).is_file(), f"artifact {artifact_id} template missing: {template}")

    skill_contracts = artifacts.get("contracts", {}).get("skills", {})
    require(set(skill_contracts) == set(skills), "artifact registry must define exactly one contract for every registered skill")

    for skill_id, asset in skills.items():
        contract = skill_contracts[skill_id]
        require(asset.get("artifact_contract") == f"skills.{skill_id}", f"skill {skill_id} artifact_contract pointer mismatch")
        require(contract.get("reads"), f"skill {skill_id} artifact contract missing reads")
        require("produces" in contract and "may_mutate" in contract and "forbidden_mutations" in contract, f"skill {skill_id} artifact contract incomplete")
        for artifact_id in contract.get("produces", []) + contract.get("may_mutate", []):
            require(artifact_id in artifact_types, f"skill {skill_id} references unknown artifact type {artifact_id}")
        text = (ROOT / asset["path"]).read_text(encoding="utf-8")
        require("## Artifact contract" in text, f"skill {skill_id} missing local Artifact contract section")
        require(".agents/artifacts.json" in text, f"skill {skill_id} does not point to canonical artifact registry")

    for required in ("AGENTS.md","docs/index.md","docs/ownership.md","docs/workflow/v2-skill-loop.md","docs/workflow/artifact-contracts.md","docs/workflow/plan-deltas.md","docs/templates/delivery-ticket.md",".agents/artifacts.json",".agents/rules/artifact-contracts.md",".codex/config.toml"):
        require((ROOT / required).is_file(), f"required harness artifact missing: {required}")

    print(f"OK: 0 named agents, {len(skills)} skills, {len(roles)} authority roles, {len(rules)} rules, {len(artifact_types)} artifact types; routing/ownership/artifact invariants valid")


if __name__ == "__main__":
    main()
