"""Construct external workload manifests with exact eval-manifest fingerprints."""
from __future__ import annotations

from pathlib import Path

from .agent_eval import load_manifest
from .workload_evidence import fingerprint, validate_workload


def _repo_relative(root: Path, path: Path) -> str:
    root = root.resolve()
    resolved = path.resolve()
    try:
        return str(resolved.relative_to(root)).replace("\\", "/")
    except ValueError as exc:
        raise ValueError(f"manifest path escapes repository root: {path}") from exc


def build_external_workload(
    *,
    root: Path,
    workload_id: str,
    repository: str,
    ref: str,
    commit: str,
    task: str,
    allowed_scope: list[str],
    verification: list[str],
    baseline_manifest_path: Path,
    governed_manifest_path: Path,
) -> dict:
    baseline = load_manifest(baseline_manifest_path)
    governed = load_manifest(governed_manifest_path)
    value = {
        "schema": "yaaw.workload/v1",
        "id": workload_id,
        "provenance": {"kind": "EXTERNAL", "repository": repository, "ref": ref, "commit": commit},
        "task": task,
        "allowed_scope": list(dict.fromkeys(allowed_scope)),
        "verification": list(verification),
        "baseline_manifest": _repo_relative(root, baseline_manifest_path),
        "governed_manifest": _repo_relative(root, governed_manifest_path),
        "baseline_manifest_id": baseline["id"],
        "governed_manifest_id": governed["id"],
        "baseline_manifest_fingerprint": fingerprint(baseline),
        "governed_manifest_fingerprint": fingerprint(governed),
    }
    validate_workload(value)
    return value
