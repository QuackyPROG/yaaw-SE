"""Provider-neutral end-to-end agent trial evaluation primitives."""
from __future__ import annotations

import json
import math
import subprocess
import time
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Protocol


class AgentEvalError(RuntimeError):
    pass


@dataclass(frozen=True)
class AdapterIdentity:
    runtime_id: str
    provider: str
    model: str
    external: bool = False

    def validate(self) -> None:
        for name, value in (("runtime_id", self.runtime_id), ("provider", self.provider), ("model", self.model)):
            if not isinstance(value, str) or not value.strip():
                raise AgentEvalError(f"adapter identity requires non-empty {name}")
        if self.external and self.provider == "fixture":
            raise AgentEvalError("external adapter may not use fixture provider identity")


@dataclass(frozen=True)
class AdapterResult:
    exit_code: int
    output: str
    trace: tuple[dict, ...]
    tokens: int = 0
    cost_usd: float = 0.0
    duration_ms: int = 0


class RuntimeAdapter(Protocol):
    identity: AdapterIdentity

    def invoke(self, manifest: dict, attempt: int) -> AdapterResult: ...


@dataclass(frozen=True)
class Grade:
    passed: bool
    reasons: tuple[str, ...]


@dataclass(frozen=True)
class TrialResult:
    attempt: int
    passed: bool
    outcome_passed: bool
    trace_passed: bool
    outcome_reasons: tuple[str, ...]
    trace_reasons: tuple[str, ...]
    policy_violations: int
    replans: int
    tokens: int
    cost_usd: float
    duration_ms: int
    exit_code: int

    def to_dict(self) -> dict:
        value = asdict(self)
        for key in ("outcome_reasons", "trace_reasons"):
            value[key] = list(value[key])
        return value


class FakeRuntimeAdapter:
    """Deterministic CI adapter. Its results are simulation, never empirical proof."""

    identity = AdapterIdentity("fake-runtime", "fixture", "deterministic-sequence", external=False)

    def __init__(self, sequence: list[bool]) -> None:
        if not sequence:
            raise AgentEvalError("fake adapter sequence must not be empty")
        self.sequence = list(sequence)

    def invoke(self, manifest: dict, attempt: int) -> AdapterResult:
        success = self.sequence[(attempt - 1) % len(self.sequence)]
        run_id = f"fixture-run-{attempt}"
        trace_id = f"fixture-trace-{attempt}"
        base = {
            "schema": "yaaw.event/v1",
            "work_id": manifest["id"],
            "actor": "fixture-agent",
            "timestamp": "2026-09-04T00:00:00+00:00",
            "run_id": run_id,
            "trace_id": trace_id,
        }
        trace = [
            {**base, "event": "GATEWAY_ALLOWED", "span_id": f"allow-{attempt}", "decision": "ALLOW"},
            {
                **base,
                "event": "ACTION_RESULT" if success else "ACTION_ERROR",
                "span_id": f"result-{attempt}",
                "parent_span_id": f"start-{attempt}",
                "result": "SUCCESS" if success else "FAILURE",
            },
        ]
        return AdapterResult(
            exit_code=0 if success else 1,
            output="fixture success" if success else "fixture failure",
            trace=tuple(trace),
            tokens=100 + attempt,
            cost_usd=0.0,
            duration_ms=10 + attempt,
        )


class CommandRuntimeAdapter:
    """Opt-in adapter for real/local runtime commands.

    The command receives one JSON request on stdin and must write one JSON object on
    stdout containing exit_code, output and trace, plus optional resource fields.
    Default CI never constructs this adapter.
    """

    def __init__(self, command: list[str], identity: AdapterIdentity, *, cwd: Path | None = None, timeout_seconds: int = 900) -> None:
        if not command:
            raise AgentEvalError("command adapter requires a command")
        identity.validate()
        if not identity.external:
            raise AgentEvalError("command adapter must use external=true identity; use fake adapter for simulation")
        self.command = list(command)
        self.identity = identity
        self.cwd = cwd
        self.timeout_seconds = timeout_seconds

    def invoke(self, manifest: dict, attempt: int) -> AdapterResult:
        request = {"schema": "yaaw.agent-eval-request/v1", "manifest": manifest, "attempt": attempt}
        started = time.perf_counter()
        proc = subprocess.run(
            self.command,
            input=json.dumps(request),
            text=True,
            capture_output=True,
            cwd=self.cwd,
            timeout=self.timeout_seconds,
            check=False,
        )
        elapsed_ms = max(0, int((time.perf_counter() - started) * 1000))
        if proc.returncode != 0 and not proc.stdout.strip():
            raise AgentEvalError(f"runtime command exited {proc.returncode} without structured result: {proc.stderr.strip()}")
        try:
            payload = json.loads(proc.stdout.strip().splitlines()[-1])
        except (json.JSONDecodeError, IndexError) as exc:
            raise AgentEvalError("runtime command did not return a final JSON result line") from exc
        if not isinstance(payload, dict):
            raise AgentEvalError("runtime command result must be an object")
        trace = payload.get("trace", [])
        if not isinstance(trace, list) or any(not isinstance(item, dict) for item in trace):
            raise AgentEvalError("runtime command trace must be an array of event objects")
        return AdapterResult(
            exit_code=int(payload.get("exit_code", proc.returncode)),
            output=str(payload.get("output", "")),
            trace=tuple(trace),
            tokens=max(0, int(payload.get("tokens", 0) or 0)),
            cost_usd=max(0.0, float(payload.get("cost_usd", 0.0) or 0.0)),
            duration_ms=max(0, int(payload.get("duration_ms", elapsed_ms) or 0)),
        )


def validate_manifest(manifest: dict) -> None:
    if not isinstance(manifest, dict):
        raise AgentEvalError("agent eval manifest must be an object")
    if manifest.get("schema") != "yaaw.agent-eval/v1":
        raise AgentEvalError("unsupported agent eval manifest schema")
    for field in ("id", "task"):
        if not isinstance(manifest.get(field), str) or not manifest[field].strip():
            raise AgentEvalError(f"manifest requires non-empty {field}")
    attempts = manifest.get("attempts")
    if not isinstance(attempts, int) or attempts < 1:
        raise AgentEvalError("manifest attempts must be a positive integer")
    ks = manifest.get("k", [1])
    if not isinstance(ks, list) or not ks or any(not isinstance(k, int) or k < 1 or k > attempts for k in ks):
        raise AgentEvalError("manifest k values must be integers from 1 through attempts")
    for section in ("outcome_grader", "trace_grader", "thresholds"):
        if not isinstance(manifest.get(section), dict):
            raise AgentEvalError(f"manifest requires object {section}")
    thresholds = manifest["thresholds"]
    for field in ("max_policy_violations", "max_replans", "max_total_tokens", "max_total_duration_ms"):
        if field in thresholds and (not isinstance(thresholds[field], int) or thresholds[field] < 0):
            raise AgentEvalError(f"threshold {field} must be a non-negative integer")
    if "max_total_cost_usd" in thresholds and (not isinstance(thresholds["max_total_cost_usd"], (int, float)) or thresholds["max_total_cost_usd"] < 0):
        raise AgentEvalError("threshold max_total_cost_usd must be non-negative")


def grade_outcome(result: AdapterResult, spec: dict) -> Grade:
    reasons: list[str] = []
    expected_exit = int(spec.get("expected_exit_code", 0))
    if result.exit_code != expected_exit:
        reasons.append(f"exit_code {result.exit_code} != expected {expected_exit}")
    for text in spec.get("output_contains", []):
        if str(text) not in result.output:
            reasons.append(f"output missing required text: {text}")
    for text in spec.get("output_excludes", []):
        if str(text) in result.output:
            reasons.append(f"output contains forbidden text: {text}")
    return Grade(not reasons, tuple(reasons))


def grade_trace(result: AdapterResult, spec: dict) -> Grade:
    reasons: list[str] = []
    events = [str(item.get("event", "")) for item in result.trace]
    for event in spec.get("require_events", []):
        if event not in events:
            reasons.append(f"trace missing required event: {event}")
    for event in spec.get("forbid_events", []):
        if event in events:
            reasons.append(f"trace contains forbidden event: {event}")
    if spec.get("require_correlation", False):
        for index, item in enumerate(result.trace, 1):
            for field in ("run_id", "trace_id", "span_id"):
                if not isinstance(item.get(field), str) or not item[field].strip():
                    reasons.append(f"trace[{index}] missing correlation field {field}")
    return Grade(not reasons, tuple(reasons))


def pass_at_k(n: int, c: int, k: int) -> float:
    if not (0 <= c <= n and 1 <= k <= n):
        raise ValueError("pass@k requires 0 <= c <= n and 1 <= k <= n")
    if n - c < k:
        return 1.0
    return 1.0 - (math.comb(n - c, k) / math.comb(n, k))


def pass_power_k(n: int, c: int, k: int) -> float:
    if not (0 <= c <= n and 1 <= k <= n):
        raise ValueError("pass^k requires 0 <= c <= n and 1 <= k <= n")
    if c < k:
        return 0.0
    return math.comb(c, k) / math.comb(n, k)


def _event_count(trace: tuple[dict, ...], names: set[str]) -> int:
    return sum(1 for item in trace if str(item.get("event", "")) in names)


def _thresholds_met(report: dict, thresholds: dict) -> bool:
    checks = [
        report["pass_rate"] >= float(thresholds.get("min_pass_rate", 0.0)),
        report["trace_pass_rate"] >= float(thresholds.get("min_trace_pass_rate", 0.0)),
        report["policy_violations"] <= int(thresholds.get("max_policy_violations", 0)),
    ]
    if "max_replans" in thresholds:
        checks.append(report["replans"] <= int(thresholds["max_replans"]))
    if "max_total_tokens" in thresholds:
        checks.append(report["total_tokens"] <= int(thresholds["max_total_tokens"]))
    if "max_total_cost_usd" in thresholds:
        checks.append(report["total_cost_usd"] <= float(thresholds["max_total_cost_usd"]))
    if "max_total_duration_ms" in thresholds:
        checks.append(report["total_duration_ms"] <= int(thresholds["max_total_duration_ms"]))
    return all(checks)


def run_trials(manifest: dict, adapter: RuntimeAdapter) -> dict:
    validate_manifest(manifest)
    adapter.identity.validate()
    attempts = int(manifest["attempts"])
    trials: list[TrialResult] = []
    policy_events = {"POLICY_VIOLATION", "SCOPE_DRIFT", "QA_ESCAPE"}
    for attempt in range(1, attempts + 1):
        result = adapter.invoke(manifest, attempt)
        outcome = grade_outcome(result, manifest["outcome_grader"])
        trace_grade = grade_trace(result, manifest["trace_grader"])
        trials.append(
            TrialResult(
                attempt=attempt,
                passed=outcome.passed and trace_grade.passed,
                outcome_passed=outcome.passed,
                trace_passed=trace_grade.passed,
                outcome_reasons=outcome.reasons,
                trace_reasons=trace_grade.reasons,
                policy_violations=_event_count(result.trace, policy_events),
                replans=_event_count(result.trace, {"PLAN_DELTA"}),
                tokens=result.tokens,
                cost_usd=result.cost_usd,
                duration_ms=result.duration_ms,
                exit_code=result.exit_code,
            )
        )
    passed = sum(1 for trial in trials if trial.passed)
    outcome_passed = sum(1 for trial in trials if trial.outcome_passed)
    trace_passed = sum(1 for trial in trials if trial.trace_passed)
    ks = sorted(set(int(k) for k in manifest.get("k", [1])))
    evidence_class = "OBSERVED" if adapter.identity.external else "SIMULATED"
    total_tokens = sum(trial.tokens for trial in trials)
    total_cost = round(sum(trial.cost_usd for trial in trials), 6)
    total_duration = sum(trial.duration_ms for trial in trials)
    report = {
        "schema": "yaaw.agent-eval-report/v1",
        "manifest_id": manifest["id"],
        "identity": asdict(adapter.identity),
        "evidence_class": evidence_class,
        "attempts": attempts,
        "passed": passed,
        "outcome_passed": outcome_passed,
        "trace_passed": trace_passed,
        "pass_rate": passed / attempts,
        "outcome_pass_rate": outcome_passed / attempts,
        "trace_pass_rate": trace_passed / attempts,
        "pass_at_k": {str(k): pass_at_k(attempts, passed, k) for k in ks},
        "pass_power_k": {str(k): pass_power_k(attempts, passed, k) for k in ks},
        "policy_violations": sum(trial.policy_violations for trial in trials),
        "replans": sum(trial.replans for trial in trials),
        "total_tokens": total_tokens,
        "total_cost_usd": total_cost,
        "total_duration_ms": total_duration,
        "efficiency": {
            "tokens_per_attempt": round(total_tokens / attempts, 3),
            "cost_per_attempt_usd": round(total_cost / attempts, 6),
            "duration_per_attempt_ms": round(total_duration / attempts, 3),
            "tokens_per_passing_trial": round(total_tokens / passed, 3) if passed else None,
            "cost_per_passing_trial_usd": round(total_cost / passed, 6) if passed else None,
            "duration_per_passing_trial_ms": round(total_duration / passed, 3) if passed else None,
        },
        "trials": [trial.to_dict() for trial in trials],
    }
    report["thresholds_met"] = _thresholds_met(report, manifest["thresholds"])
    return report


def load_manifest(path: Path) -> dict:
    value = json.loads(path.read_text(encoding="utf-8"))
    validate_manifest(value)
    return value
