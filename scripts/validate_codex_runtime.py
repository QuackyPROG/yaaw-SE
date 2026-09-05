#!/usr/bin/env python3
"""Static conformance checks for the yaaw-SE v2 Codex host adapter."""
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
    require(config.get("model") == "gpt-5.6-luna", "v2 Codex root default must be gpt-5.6-luna")
    require(config.get("model_reasoning_effort") == "max", "v2 Codex root reasoning default must be max")

    # Codex currently exposes fresh child execution through its agent transport. yaaw-SE
    # uses that mechanism generically; there are intentionally no named role adapters.
    transport = config.get("agents", {})
    require(transport.get("enabled") is True, "generic fresh execution transport must be enabled")
    require(transport.get("default_subagent_model") == "gpt-5.6-luna", "generic fresh execution default must be gpt-5.6-luna")
    require(transport.get("default_subagent_reasoning_effort") == "xhigh", "generic fresh execution reasoning must be xhigh")
    require(transport.get("max_concurrent_threads_per_session") <= 3, "generic child-context cap must remain <=3")

    v2 = config.get("features", {}).get("multi_agent_v2", {})
    require(v2.get("enabled") is True, "Codex fresh-context transport must be enabled")
    require(v2.get("max_concurrent_threads_per_session") <= 4, "total thread cap must remain <=4")
    require(not (ROOT / ".codex/agents").exists(), "named .codex/agents role profiles must be absent")

    instructions = config.get("developer_instructions", "")
    for phrase in ("five locked public skills","_yaaw-core/","yaaw-orchestrator","generic fresh execution context","Controller.from_repository","yaaw_cli.py context","Controller.admit_agent_invocation","controller admission","max_total_llm_tokens","config/context-budget.json","survive controller/runtime reconstruction","untrusted data"):
        require(phrase in instructions, f"Codex root instructions missing invariant: {phrase}")

    print("OK: Codex v2 adapter exposes five skills, no named role profiles, generic fresh contexts, persisted controller/token admission and trust boundaries")


if __name__ == "__main__":
    main()
