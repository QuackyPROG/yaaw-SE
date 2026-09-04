from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path

from scripts.yaaw.artifact_index import archive_manifest, build_index
from scripts.yaaw.metrics import summarize
from scripts.yaaw.planning_quality import acceptance_issues, plan_issues
from scripts.yaaw.qa_tracking import make_finding, make_residual_risk, reconcile_findings
from scripts.yaaw.repository_map import RepositoryMap, Subsystem
from scripts.yaaw.retrieval import plan_retrieval, validate_hook_registry


class QATrackingTests(unittest.TestCase):
    def test_finding_identity_survives_repair_cycle(self):
        first = make_finding("DEL-7", "HIGH", "Authorization bypass on retry", 1)
        second = reconcile_findings("DEL-7", [first], [{"severity":"HIGH","summary":"Authorization bypass on retry"}], 2)
        self.assertEqual(second[0].id, first.id)
        self.assertEqual(second[0].last_seen_cycle, 2)
    def test_missing_finding_is_resolved_not_erased(self):
        first = make_finding("DEL-7", "HIGH", "Authorization bypass", 1)
        second = reconcile_findings("DEL-7", [first], [], 2)
        self.assertEqual(second[0].status, "RESOLVED")
    def test_residual_risk_has_stable_id(self):
        self.assertEqual(make_residual_risk("DEL-7", "provider sandbox unavailable").id, make_residual_risk("DEL-7", "provider sandbox unavailable").id)


class PlanningQualityTests(unittest.TestCase):
    def test_generic_acceptance_is_rejected(self):
        self.assertTrue(acceptance_issues(["works correctly"]))
        self.assertTrue(acceptance_issues(["implement backend"]))
    def test_observable_acceptance_is_allowed(self):
        self.assertEqual(acceptance_issues(["Rejects a stale source fingerprint before dispatch"]), [])
    def test_unbounded_expected_surface_is_rejected(self):
        self.assertTrue(plan_issues({"kind":"DELIVERY","acceptance":["Records an observed outcome"],"expected_change_surface":["**"]}))


class RetrievalTests(unittest.TestCase):
    def test_plan_is_provider_neutral_and_ordered(self):
        repo = RepositoryMap([Subsystem("auth", ("src/auth/**",), ("SessionService",), ("tests/auth/**",), ("docs/auth.md",))])
        hooks = [item.hook for item in plan_retrieval("src/auth/login.py", repo)]
        self.assertEqual(hooks, ["ownership","repository_map","symbol_search","test_map","history"])
    def test_registry_is_evidence_only(self):
        root = Path(__file__).resolve().parents[2]
        data = json.loads((root / "config/retrieval-hooks.json").read_text(encoding="utf-8"))
        self.assertEqual(validate_hook_registry(data), [])


class ArtifactLifecycleTests(unittest.TestCase):
    def test_archive_manifest_keeps_source_path_and_digest(self):
        with tempfile.TemporaryDirectory() as td:
            root = Path(td)
            p = root / "ticket.md"
            p.write_text('---yaaw-json\n{"schema":"yaaw.ticket/v1","id":"D-1","kind":"DELIVERY","status":"DONE","level":1,"owner":"x","blocked_by":[],"acceptance":["Records an outcome"],"qa":{"required":false}}\n---\n# D-1\n', encoding="utf-8")
            entries = build_index(root)
            manifest = archive_manifest(entries, ["D-1"])
            self.assertEqual(manifest["policy"], "REFERENCE_ONLY_STABLE_PATH")
            self.assertEqual(manifest["artifacts"][0]["path"], "ticket.md")
            self.assertTrue(p.exists())


class QualityMetricsTests(unittest.TestCase):
    def test_drift_escape_and_intervention_are_measurable(self):
        metrics = summarize([
            {"event":"PLAN_DELTA"}, {"event":"SCOPE_DRIFT"}, {"event":"QA_ESCAPE"}, {"event":"HUMAN_INTERVENTION"},
            {"event":"FAILURE_SIGNATURE","signature":"x"}, {"event":"FAILURE_SIGNATURE","signature":"x"},
        ])
        self.assertEqual((metrics.plan_churn, metrics.scope_drift, metrics.qa_escapes, metrics.human_interventions, metrics.repeated_failure_signatures), (1,1,1,1,1))


if __name__ == "__main__":
    unittest.main()
