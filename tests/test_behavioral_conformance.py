import json
import unittest
from pathlib import Path

from scripts.behavior_oracle import determine_next, load_json, run_fixture_cases

ROOT = Path(__file__).resolve().parents[1]
CORE = ROOT / ".yaaw-core"
FIXTURES = ROOT / "tests" / "fixtures" / "lifecycle_cases.json"


class BehavioralConformanceTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.policy = load_json(CORE / "registries/routing-policy.json")
        cls.fixtures = load_json(FIXTURES)["cases"]

    def test_all_lifecycle_fixtures_match_expected_route(self):
        self.assertEqual(run_fixture_cases(FIXTURES), [])

    def test_fixture_suite_covers_required_lifecycle_cases(self):
        ids = {case["id"] for case in self.fixtures}
        required_prefixes = set("ABCDEFGHIJKLMNOPQ")
        covered = {case_id.split("-", 1)[0] for case_id in ids}
        self.assertTrue(required_prefixes.issubset(covered))

    def test_every_nonterminal_expected_workflow_is_registered(self):
        workflows = json.loads((CORE / "registries/workflows.json").read_text())
        for case in self.fixtures:
            workflow = case["expected"]["workflow"]
            if workflow is not None:
                self.assertIn(workflow, workflows, case["id"])

    def test_repair_precedes_review_across_different_tickets(self):
        case = next(case for case in self.fixtures if case["id"] == "N-repair-precedes-review")
        result = determine_next(case["observed"], self.policy)
        self.assertEqual(result["workflow"], "implementation.repair-ticket")

    def test_interrupted_complete_implementation_is_not_reimplemented(self):
        case = next(case for case in self.fixtures if case["id"] == "F-interrupted-implementation-complete")
        result = determine_next(case["observed"], self.policy)
        self.assertEqual(result["workflow"], "review.review-ticket")
        self.assertEqual(result["reconciliations"][0]["to"], "REVIEW_REQUIRED")

    def test_stale_pass_returns_to_planning(self):
        case = next(case for case in self.fixtures if case["id"] == "J-stale-pass-invalidates")
        result = determine_next(case["observed"], self.policy)
        self.assertEqual(result["workflow"], "planning.replan")
        self.assertEqual(result["reconciliations"][0]["from"], "PASS")


if __name__ == "__main__":
    unittest.main()
