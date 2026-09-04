#!/usr/bin/env python3
"""Compare baseline and yaaw-SE-governed workload evidence without inventing proof."""
from __future__ import annotations

import argparse
import json
from pathlib import Path

from yaaw.agent_eval import FakeRuntimeAdapter, load_manifest, run_trials
from yaaw.workload_evidence import compare_evidence, evidence_record, fingerprint, load_report, load_workload

ROOT = Path(__file__).resolve().parents[1]


def _resolve(rel: str) -> Path:
    path = (ROOT / rel).resolve()
    if ROOT.resolve() not in path.parents and path != ROOT.resolve():
        raise ValueError(f"path escapes repository root: {rel}")
    return path


def _simulate(manifest_ref: str) -> dict:
    manifest = load_manifest(_resolve(manifest_ref))
    sequence = manifest.get("fixture", {}).get("sequence")
    if not isinstance(sequence, list) or not sequence or any(not isinstance(v, bool) for v in sequence):
        raise ValueError(f"simulation manifest {manifest_ref} requires fixture.sequence")
    report = run_trials(manifest, FakeRuntimeAdapter(sequence))
    report["manifest_fingerprint"] = fingerprint(manifest)
    return report


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--workload", default="evals/workloads/synthetic-local.json")
    parser.add_argument("--simulate", action="store_true", help="run both lanes through deterministic fake adapters; output remains UNPROVEN")
    parser.add_argument("--baseline-report")
    parser.add_argument("--governed-report")
    parser.add_argument("--baseline-status", choices=["NOT_RUN", "BLOCKED", "FAILED", "OBSERVED"], default="NOT_RUN")
    parser.add_argument("--governed-status", choices=["NOT_RUN", "BLOCKED", "FAILED", "OBSERVED"], default="NOT_RUN")
    parser.add_argument("--baseline-reason")
    parser.add_argument("--governed-reason")
    parser.add_argument("--report")
    args = parser.parse_args()

    workload = load_workload(Path(args.workload))
    if args.simulate:
        if args.baseline_report or args.governed_report:
            raise SystemExit("ERROR: --simulate cannot be combined with report inputs")
        baseline_report = _simulate(workload["baseline_manifest"])
        governed_report = _simulate(workload["governed_manifest"])
        baseline_status = governed_status = "OBSERVED"
    else:
        baseline_status, governed_status = args.baseline_status, args.governed_status
        baseline_report = load_report(Path(args.baseline_report)) if args.baseline_report else None
        governed_report = load_report(Path(args.governed_report)) if args.governed_report else None

    baseline = evidence_record(workload, "baseline", baseline_status, report=baseline_report, reason=args.baseline_reason)
    governed = evidence_record(workload, "governed", governed_status, report=governed_report, reason=args.governed_reason)
    comparison = compare_evidence(baseline, governed)
    rendered = json.dumps(comparison, indent=2, sort_keys=True)
    print(rendered)
    if args.report:
        path = Path(args.report)
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(rendered + "\n", encoding="utf-8")
    if args.simulate:
        if baseline.get("manifest_match") is not True or governed.get("manifest_match") is not True:
            print("ERROR: synthetic workload manifest fingerprint mismatch")
            return 2
        if comparison.get("proof_class") != "UNPROVEN":
            print("ERROR: synthetic comparison must remain UNPROVEN")
            return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
