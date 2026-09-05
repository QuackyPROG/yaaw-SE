#!/usr/bin/env python3
"""Static conformance checks for the optional Codex runtime adapter."""
from __future__ import annotations

import tomllib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def load_toml(path: Path):
    with path.open("rb") as handle:
        return tomllib.load(handle)


def require(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(f"ERROR: {message}")


def main() -> None:
    config = load_toml(ROOT / ".codex/config.toml")

    # yaaw-SEv2 design-branch model policy. These are runtime defaults only;
    # they do not grant workflow authority or change engineering semantics.
    require(config.get("model") == "gpt-5.6-luna", "v2 Codex root default must be gpt-5.6-luna")
    require(config.get("model_reasoning_effort") == "max", "v2 Codex root reasoning default must be max")

    agents = config.get("agents", {})
    require(agents.get("enabled") is True, "Codex agents must be enabled")
    require(agents.get("default_subagent_model") == "gpt-5.6-luna", "v2 spawned-agent default must be gpt-5.6-luna")
    require(agents.get("default_subagent_reasoning_effort") == "xhigh", "v2 spawned-agent reasoning default must be xhigh")
    require(agents.get("max_concurrent_threads_per_session") <= 3, "spawned-child cap must remain <= 3")

    v2 = config.get("features", {}).get("multi_agent_v2", {})
    require(v2.get("enabled") is True, "project-local Multi-Agent V2 adapter must be enabled")
    require(v2.get("max_concurrent_threads_per_session") <= 4, "V2 total thread cap must remain <= 4 (root + children)")

    instructions = config.get("developer_instructions", "")
    for phrase in (
        "Only the root Orchestrator may spawn",
        "one mutating agent",
        "STOP_AND_REPLAN",
        ".agents/artifacts.json",
        "controller admission",
        "untrusted data",
        "yaaw_cli.py context",
        "Controller.from_repository",
        "Controller.admit_agent_invocation",
        "max_total_llm_tokens",
        "config/context-budget.json",
        "survive controller/runtime reconstruction",
        "_yaaw-SE/",
        "yaaw-prd",
    ):
        require(phrase in instructions, f"Codex root instructions missing invariant: {phrase}")

    expected = {"orchestrator", "planner", "discovery", "implementer", "qa", "release-engineer"}
    seen = set()
    for path in sorted((ROOT / ".codex/agents").glob("*.toml")):
        data = load_toml(path)
        name = data.get("name")
        require(name, f"adapter {path.name} missing name")
        require(name == path.stem, f"adapter name/path mismatch: {path.name} -> {name}")
        require("model" not in data and "model_reasoning_effort" not in data,
                f"{path.name} hard-codes role-specific model policy; use the project spawned-agent default unless an admitted runtime override is explicit")
        require("Do not spawn" in data.get("developer_instructions", "") or name == "orchestrator",
                f"child adapter {name} must forbid recursive delegation")
        seen.add(name)

    require(seen == expected, f"Codex role adapters mismatch: expected {sorted(expected)}, got {sorted(seen)}")
    print("OK: Codex adapter is root-only, bounded, Luna-defaulted, persisted-controller/token-admitted, trust-aware and aligned with registered roles")


if __name__ == "__main__":
    main()
