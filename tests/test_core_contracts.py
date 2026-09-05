import json
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CORE = ROOT / ".yaaw-core"


class CoreContractsTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.workflows = json.loads((CORE / "registries/workflows.json").read_text())
        cls.skills = json.loads((CORE / "registries/skills.json").read_text())

    def test_every_public_skill_routes_to_canonical_workflow(self):
        for skill, entry in self.skills.items():
            self.assertIn(entry["workflow_id"], self.workflows, skill)
            self.assertEqual(entry["role"], self.workflows[entry["workflow_id"]]["role"], skill)

    def test_public_skills_are_thin(self):
        for skill in self.skills:
            lines = (ROOT / "skills" / skill / "SKILL.md").read_text().splitlines()
            self.assertLessEqual(len(lines), 20, skill)

    def test_registered_workflow_files_exist(self):
        for workflow_id, entry in self.workflows.items():
            self.assertTrue((ROOT / entry["workflow"]).is_file(), workflow_id)

    def test_no_named_agent_layer(self):
        self.assertFalse((ROOT / ".agents").exists())
        self.assertFalse((ROOT / "agents").exists())

    def test_authority_contract_keeps_orchestrator_non_semantic(self):
        text = (CORE / "roles/orchestrator.md").read_text().lower()
        self.assertIn("must not author product decisions", text)
        self.assertIn("architecture", text)
        self.assertIn("acceptance", text)

    def test_review_outcomes_and_ticket_states_are_locked(self):
        review = json.loads((CORE / "schemas/review.schema.json").read_text())
        outcomes = set(review["properties"]["result"]["enum"])
        self.assertEqual(outcomes, {"PASS", "REPAIR", "REPLAN", "BLOCKED"})
        state = json.loads((CORE / "schemas/project-state.schema.json").read_text())
        states = set(state["properties"]["tickets"]["additionalProperties"]["enum"])
        self.assertIn("READY", states)
        self.assertIn("REVIEW_REQUIRED", states)
        self.assertIn("REPAIR_REQUIRED", states)
        self.assertIn("REPLAN_REQUIRED", states)
        self.assertIn("PASS", states)


if __name__ == "__main__":
    unittest.main()
