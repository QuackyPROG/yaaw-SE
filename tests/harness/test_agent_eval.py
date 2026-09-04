import tempfile
import unittest
from pathlib import Path

from scripts.yaaw.agent_eval import (
    AdapterIdentity,
    AdapterResult,
    AgentEvalError,
    CommandRuntimeAdapter,
    FakeRuntimeAdapter,
    grade_outcome,
    grade_trace,
    load_manifest,
    pass_at_k,
    pass_power_k,
    run_trials,
)


class AgentEvalTests(unittest.TestCase):
    def manifest(self):
        return {
            "schema": "yaaw.agent-eval/v1",
            "id": "fixture",
            "task": "test runner",
            "attempts": 4,
            "k": [1, 2, 3],
            "outcome_grader": {"expected_exit_code": 0, "output_contains": ["ok"]},
            "trace_grader": {"require_events": ["GATEWAY_ALLOWED"], "forbid_events": ["POLICY_VIOLATION"], "require_correlation": True},
            "thresholds": {"min_pass_rate": 0.75, "min_trace_pass_rate": 1.0, "max_policy_violations": 0},
        }

    def test_standard_pass_metrics(self):
        self.assertAlmostEqual(pass_at_k(4, 3, 1), 0.75)
        self.assertAlmostEqual(pass_at_k(4, 3, 2), 1.0)
        self.assertAlmostEqual(pass_power_k(4, 3, 1), 0.75)
        self.assertAlmostEqual(pass_power_k(4, 3, 2), 0.5)
        self.assertAlmostEqual(pass_power_k(4, 3, 3), 0.25)

    def test_outcome_and_trace_graders_are_independent(self):
        result = AdapterResult(
            exit_code=1,
            output="not ok",
            trace=({"event": "GATEWAY_ALLOWED", "run_id": "r", "trace_id": "t", "span_id": "s"},),
        )
        outcome = grade_outcome(result, {"expected_exit_code": 0})
        trace = grade_trace(result, {"require_events": ["GATEWAY_ALLOWED"], "require_correlation": True})
        self.assertFalse(outcome.passed)
        self.assertTrue(trace.passed)

    def test_fake_trials_are_simulated_and_compute_reliability(self):
        manifest = self.manifest()
        manifest["outcome_grader"] = {"expected_exit_code": 0, "output_contains": ["fixture success"]}
        report = run_trials(manifest, FakeRuntimeAdapter([True, True, False, True]))
        self.assertEqual(report["evidence_class"], "SIMULATED")
        self.assertEqual(report["passed"], 3)
        self.assertEqual(report["trace_passed"], 4)
        self.assertEqual(report["pass_rate"], 0.75)
        self.assertAlmostEqual(report["pass_at_k"]["2"], 1.0)
        self.assertAlmostEqual(report["pass_power_k"]["2"], 0.5)
        self.assertEqual(report["policy_violations"], 0)
        self.assertTrue(report["thresholds_met"])

    def test_trace_violation_can_fail_trial_even_when_outcome_passes(self):
        class BadTraceAdapter:
            identity = AdapterIdentity("fixture-bad", "fixture", "deterministic", external=False)

            def invoke(self, manifest, attempt):
                return AdapterResult(
                    0,
                    "ok",
                    ({"event": "POLICY_VIOLATION", "run_id": "r", "trace_id": "t", "span_id": "s"},),
                )

        manifest = self.manifest()
        manifest["attempts"] = 1
        manifest["k"] = [1]
        manifest["thresholds"] = {"min_pass_rate": 1.0, "min_trace_pass_rate": 1.0, "max_policy_violations": 0}
        report = run_trials(manifest, BadTraceAdapter())
        self.assertEqual(report["outcome_passed"], 1)
        self.assertEqual(report["trace_passed"], 0)
        self.assertEqual(report["passed"], 0)
        self.assertEqual(report["policy_violations"], 1)
        self.assertFalse(report["thresholds_met"])

    def test_external_command_adapter_requires_complete_nonfixture_identity(self):
        with self.assertRaises(AgentEvalError):
            CommandRuntimeAdapter(["echo"], AdapterIdentity("", "provider", "model", external=True))
        with self.assertRaises(AgentEvalError):
            CommandRuntimeAdapter(["echo"], AdapterIdentity("runtime", "fixture", "model", external=True))
        with self.assertRaises(AgentEvalError):
            CommandRuntimeAdapter(["echo"], AdapterIdentity("runtime", "provider", "model", external=False))

    def test_manifest_loader_rejects_k_above_attempt_count(self):
        manifest = self.manifest()
        manifest["k"] = [5]
        with tempfile.TemporaryDirectory() as td:
            path = Path(td) / "manifest.json"
            import json
            path.write_text(json.dumps(manifest), encoding="utf-8")
            with self.assertRaises(AgentEvalError):
                load_manifest(path)


if __name__ == "__main__":
    unittest.main()
