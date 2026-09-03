import json
import tempfile
import unittest
from pathlib import Path

from scripts.yaaw.approvals import ApprovalRecord
from scripts.yaaw.assurance import AssurancePolicy, qa_admission_errors
from scripts.yaaw.delivery import DeliveryError, DeliveryRecord, DeliveryStage, EnvironmentPolicy, release_engineer_required
from scripts.yaaw.evidence import EvidenceRecord, evidence_fresh
from scripts.yaaw.integration import IntegrationCheck, IntegrationConflict, classify


class AssuranceDeliveryTests(unittest.TestCase):
    def test_risk_matrix_requires_fresh_risk_specific_evidence(self):
        data = {"schema": "yaaw.qa-risk-matrix/v1", "default_verification_ids": [], "risks": {"auth": {"verification_ids": ["negative-auth"]}}}
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "matrix.json"
            path.write_text(json.dumps(data), encoding="utf-8")
            policy = AssurancePolicy.load(path)
            record = EvidenceRecord.create("negative-auth", "pytest -k auth", 0, "CI", "abc", {"spec": "v1"})
            self.assertEqual(qa_admission_errors(policy, ["auth"], "INDEPENDENT", [record], "abc", {"spec": "v1"}), [])
            self.assertTrue(qa_admission_errors(policy, ["auth"], "INDEPENDENT", [record], "def", {"spec": "v1"}))
            self.assertTrue(evidence_fresh(record, "abc", {"spec": "v1"}))

    def test_deployed_requires_observation_and_authority(self):
        policy = EnvironmentPolicy("PRODUCTION", "HUMAN_RELEASE_AUTHORITY", True, True)
        record = DeliveryRecord("DEL-1", "a", "b", DeliveryStage.DEPLOYED, "PRODUCTION", "PASS", False, "rollback")
        with self.assertRaises(DeliveryError):
            record.validate(policy, [])
        approved = ApprovalRecord.create("HUMAN_RELEASE_AUTHORITY", "PROMOTE", "PRODUCTION", "explicit-user-approval")
        observed = DeliveryRecord("DEL-1", "a", "b", DeliveryStage.DEPLOYED, "PRODUCTION", "PASS", True, "rollback")
        observed.validate(policy, [approved])

    def test_release_engineer_is_conditional(self):
        self.assertFalse(release_engineer_required(multi_branch=False, required_ci=False, environment="LOCAL", promotion=False))
        self.assertTrue(release_engineer_required(multi_branch=True, required_ci=False, environment="LOCAL", promotion=False))

    def test_integration_conflict_classification_prefers_staleness(self):
        self.assertEqual(classify(IntegrationCheck(source_fingerprints_changed=True, overlapping_paths=True)), IntegrationConflict.SOURCE_STALENESS)


if __name__ == "__main__":
    unittest.main()
