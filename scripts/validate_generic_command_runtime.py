#!/usr/bin/env python3
"""Static conformance checks for the generic command runtime adapter."""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def require(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(f"ERROR: {message}")


def main() -> int:
    config = json.loads((ROOT / "config/generic-command-runtime.json").read_text(encoding="utf-8"))
    require(config.get("schema") == "yaaw.generic-command-runtime/v1", "generic command runtime schema mismatch")
    require(config.get("transport") == "STDIO_JSON", "generic command runtime must use STDIO_JSON")
    require(config.get("request_schema") == "yaaw.agent-eval-request/v1", "request protocol mismatch")
    require(config.get("response_schema") == "yaaw.agent-eval-result/v1", "response protocol mismatch")
    require(config.get("identity_required") == ["runtime_id", "provider", "model", "external=true"], "external runtime identity must be explicit")
    require(config.get("gateway_boundary") == "EXTERNAL_WRAPPER_MUST_ENFORCE_YAAW_GATEWAY", "generic command wrapper must not bypass gateway enforcement")
    trace = config.get("trace_contract", {})
    require({"run_id", "trace_id", "span_id"}.issubset(set(trace.get("correlation_fields", []))), "trace correlation contract incomplete")
    required_events = set(trace.get("required_events", []))
    require("GATEWAY_ALLOWED" in required_events and "ACTION_RESULT" in required_events, "trace contract must expose gateway admission and action outcome")

    runner = (ROOT / "scripts/run_agent_evals.py").read_text(encoding="utf-8")
    implementation = (ROOT / "scripts/yaaw/agent_eval.py").read_text(encoding="utf-8")
    require('choices=["fake", "command"]' in runner, "agent eval runner must expose explicit command adapter")
    require("class CommandRuntimeAdapter" in implementation, "generic command invocation implementation missing")
    require("external=true identity" in implementation, "command runtime must fail closed without external identity")
    print("OK: generic command adapter uses the provider-neutral eval protocol and requires an external gateway-enforcing wrapper")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
