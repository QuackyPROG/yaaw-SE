import json
import unittest
from pathlib import Path
from scripts.behavior_oracle import determine_next, load_json, run_fixture_cases

ROOT=Path(__file__).resolve().parents[1]
CORE=ROOT/".yaaw-core"
FIXTURES=ROOT/"tests"/"fixtures"/"lifecycle_cases.json"

class BehavioralConformanceTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.policy=load_json(CORE/"registries"/"routing-policy.json")
        cls.fixtures=load_json(FIXTURES)["cases"]
    def case(self, case_id):
        return next(c for c in self.fixtures if c["id"]==case_id)
    def test_all_lifecycle_fixtures_match_expected_route(self):
        self.assertEqual(run_fixture_cases(FIXTURES),[])
    def test_fixture_suite_covers_required_lifecycle_cases(self):
        covered={c["id"].split("-",1)[0] for c in self.fixtures}
        self.assertTrue(set("ABCDEFGHIJKLMNOPQRSTUVWXYZ").issubset(covered))
    def test_every_nonterminal_expected_workflow_is_registered(self):
        workflows=json.loads((CORE/"registries/workflows.json").read_text())
        for case in self.fixtures:
            if case["expected"]["workflow"] is not None:
                self.assertIn(case["expected"]["workflow"],workflows,case["id"])
    def test_repair_precedes_review_across_different_tickets(self):
        self.assertEqual(determine_next(self.case("N-repair-precedes-review")["observed"],self.policy)["workflow"],"implementation.repair-ticket")
    def test_interrupted_complete_implementation_is_not_reimplemented(self):
        result=determine_next(self.case("F-interrupted-implementation-complete")["observed"],self.policy)
        self.assertEqual(result["workflow"],"review.review-ticket")
        self.assertEqual(result["reconciliations"][0]["to"],"REVIEW_REQUIRED")
    def test_source_stale_pass_returns_to_planning(self):
        result=determine_next(self.case("J-source-stale-pass-invalidates")["observed"],self.policy)
        self.assertEqual(result["workflow"],"planning.replan")
        self.assertEqual(result["reconciliations"][0]["reason"],"TICKET_SOURCE_STALE")
    def test_repository_stale_pass_returns_to_review(self):
        result=determine_next(self.case("V-pass-repository-drift-source-current")["observed"],self.policy)
        self.assertEqual(result["workflow"],"review.review-ticket")
        self.assertEqual(result["reconciliations"][0]["reason"],"REVIEW_REPOSITORY_STALE")
    def test_missing_review_and_legacy_identity_return_to_review(self):
        for case_id,reason in [("W-pass-review-missing-source-current","REVIEW_MISSING"),("Y-pass-legacy-identity-unverifiable","LEGACY_IDENTITY_UNVERIFIABLE")]:
            result=determine_next(self.case(case_id)["observed"],self.policy)
            self.assertEqual(result["workflow"],"review.review-ticket")
            self.assertEqual(result["reconciliations"][0]["reason"],reason)
    def test_unversioned_product_and_planning_are_allowed_but_identity_work_blocks(self):
        for case_id,workflow,terminal in [("R-unversioned-product-work","prd.route",None),("S-unversioned-planning-inspection","planning.route",None),("T-unversioned-implementation-blocked",None,"BLOCKED"),("U-unversioned-ticket-admission-blocked",None,"BLOCKED")]:
            result=determine_next(self.case(case_id)["observed"],self.policy)
            self.assertEqual(result["workflow"],workflow)
            self.assertEqual(result["terminal"],terminal)

    def test_framework_integrity_blocks_before_semantic_routing(self):
        modified=determine_next(self.case("AA-framework-modified-stops-routing")["observed"],self.policy)
        self.assertIsNone(modified["workflow"])
        self.assertEqual(modified["terminal"],"BLOCKED")
        self.assertEqual(modified["reason"],"FRAMEWORK_INTEGRITY_VIOLATION")
        inconsistent=determine_next(self.case("AB-framework-contract-inconsistency-stops-routing")["observed"],self.policy)
        self.assertEqual(inconsistent["reason"],"FRAMEWORK_CONTRACT_INCONSISTENCY")
        self.assertEqual(inconsistent["reconciliations"],[])

if __name__=="__main__":
    unittest.main()
