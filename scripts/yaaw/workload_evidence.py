"""External workload provenance and baseline-vs-governed evidence contracts."""
from __future__ import annotations

import hashlib
import json
from pathlib import Path


class WorkloadEvidenceError(ValueError):
    pass


STATUSES = {"NOT_RUN", "BLOCKED", "FAILED", "OBSERVED"}
PROVENANCE_KINDS = {"SYNTHETIC", "EXTERNAL"}


def _nonempty(value: object) -> bool:
    return isinstance(value, str) and bool(value.strip())


def _fingerprint(value: object) -> str:
    payload = json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
    return hashlib.sha256(payload).hexdigest()


def validate_workload(workload: dict) -> None:
    if not isinstance(workload, dict) or workload.get("schema") != "yaaw.workload/v1":
        raise WorkloadEvidenceError("unsupported workload manifest schema")
    for field in ("id", "task", "baseline_manifest", "governed_manifest"):
        if not _nonempty(workload.get(field)):
            raise WorkloadEvidenceError(f"workload requires non-empty {field}")
    provenance = workload.get("provenance")
    if not isinstance(provenance, dict) or provenance.get("kind") not in PROVENANCE_KINDS:
        raise WorkloadEvidenceError("workload provenance.kind must be SYNTHETIC or EXTERNAL")
    for field in ("repository", "ref", "commit"):
        if not _nonempty(provenance.get(field)):
            raise WorkloadEvidenceError(f"workload provenance requires non-empty {field}")
    for field in ("allowed_scope", "verification"):
        values = workload.get(field)
        if not isinstance(values, list) or not values or any(not _nonempty(v) for v in values):
            raise WorkloadEvidenceError(f"workload {field} must be a non-empty string array")
    if provenance["kind"] == "EXTERNAL":
        commit = provenance["commit"].strip()
        if len(commit) < 12 or any(ch not in "0123456789abcdefABCDEF" for ch in commit):
            raise WorkloadEvidenceError("EXTERNAL workload provenance.commit must be a pinned hexadecimal commit id")


def load_workload(path: Path) -> dict:
    value = json.loads(path.read_text(encoding="utf-8"))
    validate_workload(value)
    return value


def load_report(path: Path) -> dict:
    value = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(value, dict) or value.get("schema") != "yaaw.agent-eval-report/v1":
        raise WorkloadEvidenceError(f"{path} is not a yaaw.agent-eval-report/v1")
    return value


def _runtime_identity(report: dict | None) -> dict | None:
    if not report:
        return None
    identity = report.get("identity")
    if not isinstance(identity, dict):
        return None
    return {
        "runtime_id": identity.get("runtime_id"),
        "provider": identity.get("provider"),
        "model": identity.get("model"),
        "external": bool(identity.get("external", False)),
    }


def _empirical_eligible(workload: dict, report: dict | None) -> bool:
    if not report or report.get("evidence_class") != "OBSERVED":
        return False
    provenance = workload["provenance"]
    identity = _runtime_identity(report)
    if provenance.get("kind") != "EXTERNAL" or not identity or identity.get("external") is not True:
        return False
    return all(_nonempty(identity.get(field)) for field in ("runtime_id", "provider", "model"))


def evidence_record(
    workload: dict,
    lane: str,
    status: str,
    *,
    report: dict | None = None,
    reason: str | None = None,
) -> dict:
    validate_workload(workload)
    if lane not in {"baseline", "governed"}:
        raise WorkloadEvidenceError("lane must be baseline or governed")
    if status not in STATUSES:
        raise WorkloadEvidenceError(f"unsupported observation status {status!r}")
    if status == "OBSERVED" and report is None:
        raise WorkloadEvidenceError("OBSERVED evidence requires an agent-eval report")
    if status != "OBSERVED" and report is not None:
        raise WorkloadEvidenceError(f"{status} evidence must not attach an observed report")
    if status in {"BLOCKED", "FAILED"} and not _nonempty(reason):
        raise WorkloadEvidenceError(f"{status} evidence requires a reason")

    identity = _runtime_identity(report)
    proof_class = "EMPIRICAL" if status == "OBSERVED" and _empirical_eligible(workload, report) else "UNPROVEN"
    record = {
        "schema": "yaaw.workload-evidence/v1",
        "workload_id": workload["id"],
        "lane": lane,
        "status": status,
        "proof_class": proof_class,
        "workload_fingerprint": _fingerprint(workload),
        "repository": dict(workload["provenance"]),
        "runtime": identity,
        "runtime_fingerprint": _fingerprint(identity) if identity else None,
        "report_fingerprint": _fingerprint(report) if report else None,
        "reason": reason,
        "report": report,
    }
    return record


def compare_evidence(baseline: dict, governed: dict) -> dict:
    if baseline.get("schema") != "yaaw.workload-evidence/v1" or governed.get("schema") != "yaaw.workload-evidence/v1":
        raise WorkloadEvidenceError("comparison requires workload evidence records")
    if baseline.get("workload_id") != governed.get("workload_id"):
        raise WorkloadEvidenceError("comparison workload ids differ")
    if baseline.get("lane") != "baseline" or governed.get("lane") != "governed":
        raise WorkloadEvidenceError("comparison requires baseline and governed lanes")

    deltas = None
    if baseline.get("status") == "OBSERVED" and governed.get("status") == "OBSERVED":
        b_report = baseline.get("report") or {}
        g_report = governed.get("report") or {}
        deltas = {}
        for field in ("pass_rate", "trace_pass_rate"):
            deltas[field] = round(float(g_report.get(field, 0.0)) - float(b_report.get(field, 0.0)), 6)
        for field in ("policy_violations", "replans", "total_tokens", "total_cost_usd", "total_duration_ms"):
            deltas[field] = round(float(g_report.get(field, 0.0)) - float(b_report.get(field, 0.0)), 6)

    proof_class = "EMPIRICAL" if baseline.get("proof_class") == governed.get("proof_class") == "EMPIRICAL" else "UNPROVEN"
    return {
        "schema": "yaaw.workload-comparison/v1",
        "workload_id": baseline["workload_id"],
        "proof_class": proof_class,
        "baseline_status": baseline["status"],
        "governed_status": governed["status"],
        "deltas": deltas,
        "baseline": baseline,
        "governed": governed,
    }
