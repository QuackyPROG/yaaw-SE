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
        cls.expertise = json.loads((CORE / "registries/expertise.json").read_text())

    def test_every_public_skill_routes_to_canonical_workflow(self):
        for skill, entry in self.skills.items():
            self.assertIn(entry["workflow_id"], self.workflows, skill)
            self.assertEqual(entry["role"], self.workflows[entry["workflow_id"]]["role"], skill)

    def test_public_skills_have_agent_skill_frontmatter(self):
        for skill in self.skills:
            text = (ROOT / "skills" / skill / "SKILL.md").read_text()
            self.assertTrue(text.startswith("---\nname: "), skill)
            self.assertIn(f"name: {skill}\n", text, skill)
            self.assertIn("\ndescription: ", text, skill)

    def test_public_skills_are_thin(self):
        for skill in self.skills:
            lines = (ROOT / "skills" / skill / "SKILL.md").read_text().splitlines()
            self.assertLessEqual(len(lines), 24, skill)

    def test_registered_workflow_files_exist_and_are_operational_contracts(self):
        for workflow_id, entry in self.workflows.items():
            path = ROOT / entry["workflow"]
            self.assertTrue(path.is_file(), workflow_id)
            self.assertIn("## Purpose", path.read_text(), workflow_id)

    def test_orchestrator_route_and_dispatch_are_not_aliases(self):
        self.assertNotEqual(
            self.workflows["orchestration.route"]["workflow"],
            self.workflows["orchestration.dispatch"]["workflow"],
        )
        dispatch = (CORE / "workflows/orchestration/dispatch.md").read_text()
        self.assertIn("This file is not the orchestration loop", dispatch)
        self.assertIn("Never recursively dispatch", dispatch)

    def test_routing_state_precedence_prevents_review_repair_loop(self):
        text = (CORE / "core/routing.md").read_text()
        order = [
            text.index("If a ticket is `REPLAN_REQUIRED`"),
            text.index("If a ticket is `REPAIR_REQUIRED`"),
            text.index("If a ticket is `REVIEW_REQUIRED`"),
            text.index("If a ticket is `IN_PROGRESS`"),
            text.index("ticket is `READY`"),
        ]
        self.assertEqual(order, sorted(order))

    def test_state_schema_can_represent_transition_provenance(self):
        state = json.loads((CORE / "schemas/project-state.schema.json").read_text())
        required = set(state["required"])
        self.assertTrue({"transition_sequence", "last_transition", "blocker"}.issubset(required))
        transition = state["properties"]["last_transition"]["anyOf"][1]
        self.assertTrue({"reason", "evidence", "workflow", "observed_commit"}.issubset(set(transition["required"])))

    def test_review_and_evidence_bind_repository_identity(self):
        review = json.loads((CORE / "schemas/review.schema.json").read_text())
        self.assertTrue({"reviewed_head_commit", "reviewed_dirty", "reviewed_worktree_digest", "evidence"}.issubset(set(review["required"])))
        evidence = json.loads((CORE / "schemas/evidence.schema.json").read_text())
        self.assertIn("repository", evidence["required"])
        self.assertEqual(set(review["properties"]["result"]["enum"]), {"PASS", "REPAIR", "REPLAN", "BLOCKED"})

    def test_transition_contract_forbids_self_acceptance_shortcuts(self):
        text = (CORE / "core/transitions.md").read_text()
        for forbidden in ["DRAFT -> PASS", "READY -> PASS", "REPAIR_REQUIRED -> PASS"]:
            self.assertIn(forbidden, text)
        self.assertIn("PASS | REPLAN_REQUIRED", text)

    def test_invalidation_preserves_history_but_revokes_current_trust(self):
        text = (CORE / "core/invalidation.md").read_text()
        self.assertIn("Prior reviews remain immutable historical evidence", text)
        self.assertIn("REPLAN_REQUIRED", text)
        self.assertIn("STALE", text)

    def test_no_named_agent_layer(self):
        self.assertFalse((ROOT / ".agents").exists())
        self.assertFalse((ROOT / "agents").exists())

    def test_authority_contract_keeps_orchestrator_non_semantic(self):
        text = (CORE / "roles/orchestrator.md").read_text().lower()
        self.assertIn("must not author product decisions", text)
        self.assertIn("architecture", text)
        self.assertIn("acceptance", text)

    def test_changeability_is_core_policy_not_public_skill(self):
        policy = CORE / "rules/changeability.md"
        module = CORE / "expertise/changeability/MODULE.md"
        self.assertTrue(policy.is_file())
        self.assertTrue(module.is_file())
        self.assertIn("changeability", self.expertise)
        self.assertNotIn("yaaw-changeability", self.skills)
        policy_text = policy.read_text()
        for principle in [
            "Keep the main path visible",
            "Name by domain meaning",
            "Contain external systems behind boundaries",
            "Make invalid states harder to represent",
            "Separate decisions from actions",
            "Make failures useful",
            "Keep changes focused",
        ]:
            self.assertIn(principle, policy_text)

    def test_changeability_is_enforced_across_plan_build_review(self):
        required_files = [
            CORE / "roles/planner.md",
            CORE / "roles/implementer.md",
            CORE / "roles/reviewer.md",
            CORE / "workflows/planning/create-tickets.md",
            CORE / "workflows/implementation/implement-ticket.md",
            CORE / "workflows/implementation/verify-ticket.md",
            CORE / "workflows/implementation/repair-ticket.md",
            CORE / "workflows/review/review-ticket.md",
        ]
        for path in required_files:
            self.assertIn("changeability", path.read_text().lower(), str(path))

        review_template = (CORE / "templates/review.md").read_text()
        self.assertIn("## Changeability assessment", review_template)
        classify = (CORE / "workflows/review/classify-findings.md").read_text()
        self.assertIn("style preference", classify.lower())
        self.assertIn("CHANGEABILITY", classify)


if __name__ == "__main__":
    unittest.main()
