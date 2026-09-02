#!/usr/bin/env python3
"""Validate yaaw-SE registered agent assets using only the Python standard library."""
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

    require(router.get("catalog") == ".agents/catalog.json", "router catalog pointer mismatch")
    require(router.get("ownership") == ".agents/ownership.json", "router ownership pointer mismatch")
    require(set(router.get("levels", {})) == {"0", "1", "2", "3", "4"}, "router must define exactly L0-L4")
    require(router.get("ticket_kinds") == ["DISCOVERY", "DECISION", "DELIVERY"], "ticket kind contract changed")

    expected_delta_actions = {
        "CONTINUE", "AMEND_UNRESOLVED", "SPLIT", "INSERT_PREREQUISITE",
        "ADD_FOLLOWUP", "ADD_DISCOVERY", "ADD_DECISION", "RESEQUENCE",
        "PROMOTE_LEVEL", "SUPERSEDE_UNRESOLVED", "CORRECT_COMPLETED_WORK",
    }
    require(set(router.get("plan_delta", {}).get("actions", [])) == expected_delta_actions,
            "PLAN_DELTA action set is incomplete or changed")
    require(router.get("plan_delta", {}).get("completed_history_rewrite_forbidden") is True,
            "completed-history invariant must remain explicit")

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

    for required in (
        "AGENTS.md", "docs/index.md", "docs/ownership.md", "docs/workflow/plan-deltas.md",
        "docs/templates/delivery-ticket.md", ".codex/config.toml",
    ):
        require((ROOT / required).is_file(), f"required harness artifact missing: {required}")

    print(f"OK: {len(agents)} agents, {len(skills)} skills, {len(rules)} rules; routing/ownership invariants valid")


if __name__ == "__main__":
    main()
