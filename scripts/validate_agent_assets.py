#!/usr/bin/env python3
"""Validate yaaw-SE registered agents, skills, ownership and artifact contracts."""
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

    expected_delta_actions = {"CONTINUE","AMEND_UNRESOLVED","SPLIT","INSERT_PREREQUISITE","ADD_FOLLOWUP","ADD_DISCOVERY","ADD_DECISION","RESEQUENCE","PROMOTE_LEVEL","SUPERSEDE_UNRESOLVED","CORRECT_COMPLETED_WORK"}
    require(set(router.get("plan_delta", {}).get("actions", [])) == expected_delta_actions, "PLAN_DELTA action set is incomplete or changed")
    require(router.get("plan_delta", {}).get("completed_history_rewrite_forbidden") is True, "completed-history invariant must remain explicit")

    agents = {item["id"]: item for item in catalog.get("agents", [])}
    skills = {item["id"]: item for item in catalog.get("skills", [])}
    rules = {item["id"]: item for item in catalog.get("rules", [])}
    require(len(agents) == len(catalog.get("agents", [])), "duplicate agent ids")
    require(len(skills) == len(catalog.get("skills", [])), "duplicate skill ids")
    require(len(rules) == len(catalog.get("rules", [])), "duplicate rule ids")

    for collection_name, collection in (("agent", agents), ("skill", skills), ("rule", rules)):
        for asset_id, asset in collection.items():
            path = asset.get("path")
            require(path and (ROOT / path).is_file(), f"registered {collection_name} {asset_id} missing at {path}")

    for item in catalog.get("validation", []):
        require((ROOT / item["path"]).is_file(), f"validation asset missing: {item['path']}")

    for shape in router.get("work_shapes", []):
        for agent in shape.get("default_agents", []):
            require(agent in agents, f"work shape {shape['id']} references unknown agent {agent}")
        for skill in shape.get("default_skills", []):
            require(skill in skills, f"work shape {shape['id']} references unknown skill {skill}")

    valid_owners = set(agents) | {"UNKNOWN_OWNER"}
    for entry in ownership.get("entries", []):
        require(entry.get("owner") in valid_owners, f"ownership pattern {entry.get('pattern')} has unknown owner")
        co_owner = entry.get("co_owner")
        require(co_owner is None or co_owner in agents, f"ownership pattern {entry.get('pattern')} has unknown co-owner")

    artifact_types = {item["id"]: item for item in artifacts.get("artifact_types", [])}
    require(len(artifact_types) == len(artifacts.get("artifact_types", [])), "duplicate artifact type ids")
    special_owners = set(artifacts.get("special_owners", []))
    for artifact_id, artifact in artifact_types.items():
        require(artifact.get("owner") in valid_owners | special_owners, f"artifact {artifact_id} has unknown owner {artifact.get('owner')}")
        require(artifact.get("storage_kind"), f"artifact {artifact_id} missing storage_kind")
        require(artifact.get("canonical_locator"), f"artifact {artifact_id} missing canonical_locator")
        for role in artifact.get("allowed_producers", []) + artifact.get("allowed_mutators", []):
            require(role in agents, f"artifact {artifact_id} references unknown role {role}")
        template = artifact.get("template")
        require(template is None or (ROOT / template).is_file(), f"artifact {artifact_id} template missing: {template}")

    contracts = artifacts.get("contracts", {})
    agent_contracts = contracts.get("agents", {})
    skill_contracts = contracts.get("skills", {})
    require(set(agent_contracts) == set(agents), "artifact registry must define exactly one contract for every registered agent")
    require(set(skill_contracts) == set(skills), "artifact registry must define exactly one contract for every registered skill")

    def validate_contract(kind: str, asset_id: str, asset: dict, contract: dict) -> None:
        expected_pointer = f"{kind}s.{asset_id}"
        require(asset.get("artifact_contract") == expected_pointer, f"{kind} {asset_id} artifact_contract pointer mismatch")
        require(contract.get("reads"), f"{kind} {asset_id} artifact contract missing reads")
        require("produces" in contract and "may_mutate" in contract and "forbidden_mutations" in contract,
                f"{kind} {asset_id} artifact contract incomplete")
        for artifact_id in contract.get("produces", []) + contract.get("may_mutate", []):
            require(artifact_id in artifact_types, f"{kind} {asset_id} references unknown artifact type {artifact_id}")
        text = (ROOT / asset["path"]).read_text(encoding="utf-8")
        require("## Artifact contract" in text, f"{kind} {asset_id} missing local Artifact contract section")
        require(".agents/artifacts.json" in text, f"{kind} {asset_id} does not point to canonical artifact registry")

    for agent_id, asset in agents.items():
        validate_contract("agent", agent_id, asset, agent_contracts[agent_id])
    for skill_id, asset in skills.items():
        validate_contract("skill", skill_id, asset, skill_contracts[skill_id])

    for required in ("AGENTS.md","docs/index.md","docs/ownership.md","docs/workflow/artifact-contracts.md","docs/workflow/plan-deltas.md","docs/templates/delivery-ticket.md",".agents/artifacts.json",".agents/rules/artifact-contracts.md",".codex/config.toml"):
        require((ROOT / required).is_file(), f"required harness artifact missing: {required}")

    print(f"OK: {len(agents)} agents, {len(skills)} skills, {len(rules)} rules, {len(artifact_types)} artifact types; routing/ownership/artifact invariants valid")


if __name__ == "__main__":
    main()
