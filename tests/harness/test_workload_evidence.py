from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path

from scripts.yaaw.workload_evidence import WorkloadEvidenceError, compare_evidence, evidence_record, validate_workload
from scripts.yaaw.workload_manifest import build_external_workload

BASE_FP = "a" * 64
GOV_FP = "b" * 64


def workload(kind="SYNTHETIC"):
    commit = "c" * 40 if kind == "EXTERNAL" else "synthetic-v1"
    return {
        "schema": "yaaw.workload/v1",
        "id": "W-1",
        "provenance": {"kind": kind, "repository": "owner/repo", "ref": "main", "commit": commit},
        "task": "bounded task",
        "allowed_scope": ["src/**"],
        "verification": ["pytest"],
        "baseline_manifest": "evals/base.json",
        "governed_manifest": "evals/governed.json",
        "baseline_manifest_id": "BASE",
        "governed_manifest_id": "GOV",
        "baseline_manifest_fingerprint": BASE_FP,
        "governed_manifest_fingerprint": GOV_FP,
    }


def report(lane="baseline", evidence_class="SIMULATED", external=False, pass_rate=0.5, manifest_match=True, tokens=10, cost=0.01, duration=100):
    manifest_id = "BASE" if lane == "baseline" else "GOV"
    manifest_fp = BASE_FP if lane == "baseline" else GOV_FP
    if not manifest_match:
        manifest_fp = "d" * 64
    return {
        "schema": "yaaw.agent-eval-report/v1",
        "manifest_id": manifest_id,
        "manifest_fingerprint": manifest_fp,
        "identity": {"runtime_id": "runtime", "provider": "provider", "model": "model", "external": external},
        "evidence_class": evidence_class,
        "pass_rate": pass_rate,
        "trace_pass_rate": 1.0,
        "policy_violations": 0,
        "replans": 0,
        "total_tokens": tokens,
        "total_cost_usd": cost,
        "total_duration_ms": duration,
    }


class WorkloadEvidenceTests(unittest.TestCase):
    def test_synthetic_observation_is_never_empirical(self):
        record = evidence_record(workload(), "baseline", "OBSERVED", report=report())
        self.assertEqual(record["proof_class"], "UNPROVEN")
        self.assertTrue(record["manifest_match"])
        self.assertIsNotNone(record["workload_fingerprint"])

    def test_external_observed_runtime_with_pinned_commit_and_manifest_is_empirical(self):
        record = evidence_record(workload("EXTERNAL"), "governed", "OBSERVED", report=report("governed", "OBSERVED", True))
        self.assertEqual(record["proof_class"], "EMPIRICAL")
        self.assertTrue(record["manifest_match"])
        self.assertIsNotNone(record["runtime_fingerprint"])
        self.assertIsNotNone(record["report_fingerprint"])

    def test_external_observed_report_with_wrong_manifest_is_unproven(self):
        record = evidence_record(
            workload("EXTERNAL"),
            "baseline",
            "OBSERVED",
            report=report("baseline", "OBSERVED", True, manifest_match=False),
        )
        self.assertEqual(record["proof_class"], "UNPROVEN")
        self.assertFalse(record["manifest_match"])

    def test_external_workload_with_simulated_report_is_unproven(self):
        record = evidence_record(workload("EXTERNAL"), "baseline", "OBSERVED", report=report())
        self.assertEqual(record["proof_class"], "UNPROVEN")

    def test_statuses_are_preserved_without_synthetic_deltas(self):
        base = evidence_record(workload(), "baseline", "BLOCKED", reason="credentials unavailable")
        governed = evidence_record(workload(), "governed", "NOT_RUN")
        comparison = compare_evidence(base, governed)
        self.assertEqual(comparison["baseline_status"], "BLOCKED")
        self.assertEqual(comparison["governed_status"], "NOT_RUN")
        self.assertIsNone(comparison["deltas"])
        self.assertIsNone(comparison["relative"])
        self.assertEqual(comparison["proof_class"], "UNPROVEN")

    def test_observed_comparison_reports_quality_and_resource_reduction(self):
        base = evidence_record(workload(), "baseline", "OBSERVED", report=report("baseline", pass_rate=0.5, tokens=100, cost=0.02, duration=200))
        governed = evidence_record(workload(), "governed", "OBSERVED", report=report("governed", pass_rate=0.75, tokens=60, cost=0.01, duration=150))
        comparison = compare_evidence(base, governed)
        self.assertEqual(comparison["deltas"]["pass_rate"], 0.25)
        self.assertEqual(comparison["relative"]["token_reduction_ratio"], 0.4)
        self.assertEqual(comparison["relative"]["cost_reduction_ratio"], 0.5)
        self.assertEqual(comparison["relative"]["duration_reduction_ratio"], 0.25)
        self.assertTrue(comparison["relative"]["quality_non_regression"])
        self.assertTrue(comparison["relative"]["token_efficiency_improved"])
        self.assertEqual(comparison["proof_class"], "UNPROVEN")

    def test_efficiency_claim_fails_when_quality_regresses(self):
        base = evidence_record(workload(), "baseline", "OBSERVED", report=report("baseline", pass_rate=1.0, tokens=100))
        governed = evidence_record(workload(), "governed", "OBSERVED", report=report("governed", pass_rate=0.5, tokens=40))
        comparison = compare_evidence(base, governed)
        self.assertEqual(comparison["relative"]["token_reduction_ratio"], 0.6)
        self.assertFalse(comparison["relative"]["quality_non_regression"])
        self.assertFalse(comparison["relative"]["token_efficiency_improved"])

    def test_external_workload_builder_pins_manifest_identity_and_fingerprints(self):
        manifest = {
            "schema": "yaaw.agent-eval/v1",
            "id": "BASE",
            "task": "bounded task",
            "attempts": 1,
            "k": [1],
            "outcome_grader": {},
            "trace_grader": {},
            "thresholds": {},
        }
        governed_manifest = dict(manifest)
        governed_manifest["id"] = "GOV"
        with tempfile.TemporaryDirectory() as td:
            root = Path(td)
            evals = root / "evals"
            evals.mkdir()
            base_path = evals / "base.json"
            governed_path = evals / "governed.json"
            base_path.write_text(json.dumps(manifest), encoding="utf-8")
            governed_path.write_text(json.dumps(governed_manifest), encoding="utf-8")
            value = build_external_workload(
                root=root,
                workload_id="EXT-1",
                repository="owner/repo",
                ref="main",
                commit="c" * 40,
                task="bounded task",
                allowed_scope=["src/**"],
                verification=["pytest"],
                baseline_manifest_path=base_path,
                governed_manifest_path=governed_path,
            )
            self.assertEqual(value["baseline_manifest_id"], "BASE")
            self.assertEqual(value["governed_manifest_id"], "GOV")
            self.assertEqual(len(value["baseline_manifest_fingerprint"]), 64)
            self.assertEqual(len(value["governed_manifest_fingerprint"]), 64)
            self.assertEqual(value["provenance"]["commit"], "c" * 40)

    def test_observed_requires_report_and_failed_requires_reason(self):
        with self.assertRaises(WorkloadEvidenceError):
            evidence_record(workload(), "baseline", "OBSERVED")
        with self.assertRaises(WorkloadEvidenceError):
            evidence_record(workload(), "baseline", "FAILED")

    def test_external_commit_must_be_pinned_hex(self):
        value = workload("EXTERNAL")
        value["provenance"]["commit"] = "main"
        with self.assertRaises(WorkloadEvidenceError):
            validate_workload(value)

    def test_manifest_fingerprint_is_required(self):
        value = workload()
        value["baseline_manifest_fingerprint"] = "not-a-sha"
        with self.assertRaises(WorkloadEvidenceError):
            validate_workload(value)


if __name__ == "__main__":
    unittest.main()
