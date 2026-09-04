from __future__ import annotations

import unittest

from scripts.yaaw.workload_evidence import WorkloadEvidenceError, compare_evidence, evidence_record, validate_workload

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


def report(lane="baseline", evidence_class="SIMULATED", external=False, pass_rate=0.5, manifest_match=True):
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
        "total_tokens": 10,
        "total_cost_usd": 0.01,
        "total_duration_ms": 100,
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
        self.assertEqual(comparison["proof_class"], "UNPROVEN")

    def test_observed_comparison_reports_governed_minus_baseline(self):
        base = evidence_record(workload(), "baseline", "OBSERVED", report=report("baseline", pass_rate=0.5))
        governed = evidence_record(workload(), "governed", "OBSERVED", report=report("governed", pass_rate=0.75))
        comparison = compare_evidence(base, governed)
        self.assertEqual(comparison["deltas"]["pass_rate"], 0.25)
        self.assertEqual(comparison["proof_class"], "UNPROVEN")

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
