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
    require(config.get("model_admission_boundary") == "EXTERNAL_WRAPPER_MUST_ENFORCE_TOKEN_BUDGET_ADMISSION", "generic command wrapper must enforce model token-budget admission")
    require(config.get("context_contract") == "YAAW_HANDOFF_V1_FROM_TOKEN_BUDGETED_CONTEXT_BUILDER", "generic command wrapper must consume a token-budgeted yaaw handoff")
    trace = config.get("trace_contract", {})
    require({"run_id", "trace_id", "span_id"}.issubset(set(trace.get("correlation_fields", []))), "trace correlation contract incomplete")
    required_events = set(trace.get("required_events", []))
    require("GATEWAY_ALLOWED" in required_events and "ACTION_RESULT" in required_events, "trace contract must expose gateway admission and action outcome")

    runner = (ROOT / "scripts/run_agent_evals.py").read_text(encoding="utf-8")
    implementation = (ROOT / "scripts/yaaw/agent_eval.py").read_text(encoding="utf-8")
    controller = (ROOT / "scripts/yaaw/controller.py").read_text(encoding="utf-8")
    context = (ROOT / "scripts/yaaw/context.py").read_text(encoding="utf-8")
    require('choices=["fake", "command"]' in runner, "agent eval runner must expose explicit command adapter")
    require("class CommandRuntimeAdapter" in implementation, "generic command invocation implementation missing")
    require("external=true identity" in implementation, "command runtime must fail closed without external identity")
    require("def admit_agent_invocation" in controller, "controller must expose atomic model dispatch/token admission")
    require("def from_repository" in context and "context_budget" in context, "context builder must expose token-budgeted repository handoffs")
    print("OK: generic command adapter requires an external gateway/token-admission wrapper and token-budgeted handoff")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
