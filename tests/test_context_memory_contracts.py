import json
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CORE = ROOT / ".yaaw-core"


class ContextMemoryContractsTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.policy = json.loads((CORE / "registries/context-policy.json").read_text())
        cls.handoff_schema = json.loads((CORE / "schemas/handoff.schema.json").read_text())
        cls.handoff_template = json.loads((CORE / "templates/handoff.json").read_text())

    def test_memory_policy_is_optional_and_role_specific(self):
        self.assertEqual(self.policy["schema"], "yaaw.context-policy/v1")
        self.assertEqual(self.policy["defaults"]["provider"], "optional")
        self.assertEqual(self.policy["defaults"]["fallback"], "durable-artifacts-and-repository")
        roles = self.policy["roles"]
        self.assertEqual(set(roles), {"prd", "planner", "implementer", "reviewer", "orchestrator"})
        self.assertEqual(roles["orchestrator"]["memory_mode"], "disabled")
        self.assertEqual(roles["planner"]["memory_phase"], "before-broad-discovery")
        self.assertEqual(roles["implementer"]["memory_phase"], "before-broad-discovery")
        self.assertEqual(roles["reviewer"]["memory_phase"], "after-primary-evidence-review")

    def test_handoff_carries_context_policy(self):
        self.assertEqual(self.handoff_schema["$id"], "yaaw.handoff/v2")
        self.assertIn("context_policy", self.handoff_schema["required"])
        self.assertEqual(self.handoff_template["schema"], "yaaw.handoff/v2")
        self.assertTrue(set(self.handoff_schema["properties"]["context_policy"]["required"]).issubset(self.handoff_template["context_policy"]))

    def test_orchestrator_is_memory_blind_for_routing(self):
        role = (CORE / "roles/orchestrator.md").read_text()
        inspect = (CORE / "workflows/orchestration/inspect-state.md").read_text()
        determine = (CORE / "workflows/orchestration/determine-next-action.md").read_text()
        self.assertIn("must not query semantic project memory", role)
        self.assertIn("Do not query or use project memory", inspect)
        self.assertIn("Project memory cannot influence lifecycle routing", determine)

    def test_planner_and_implementer_retrieve_before_broad_rediscovery(self):
        discover = (CORE / "workflows/planning/discover.md").read_text()
        implement = (CORE / "workflows/implementation/implement-ticket.md").read_text()
        self.assertIn("search curated project knowledge first", discover)
        self.assertIn("before broad code archaeology", implement)
        self.assertIn("Verify any remembered claim", implement)

    def test_reviewer_keeps_memory_secondary_and_never_uses_it_for_pass(self):
        reviewer = (CORE / "roles/reviewer.md").read_text()
        inspect = (CORE / "workflows/review/inspect-change.md").read_text()
        review = (CORE / "workflows/review/review-ticket.md").read_text()
        self.assertIn("primary acceptance review", reviewer)
        self.assertIn("Do not consult project memory during this primary inspection", inspect)
        self.assertIn("Memory may explain but is never acceptance evidence", review)
        self.assertIn("cannot manufacture `PASS`", review)

    def test_memory_cannot_be_direct_source_of_specs_or_tickets(self):
        spec = (CORE / "workflows/planning/create-spec.md").read_text()
        tickets = (CORE / "workflows/planning/create-tickets.md").read_text()
        self.assertIn("Do not place a remembered historical claim directly into a spec", spec)
        self.assertIn("not directly from project memory or prior conversation", tickets)

    def test_live_control_files_are_excluded_from_deliberate_memory_ingestion(self):
        memory = (CORE / "core/project-memory.md").read_text()
        for path in ["AGENTS.md", "skills/**", ".yaaw-core/**", ".yaaw/runtime/**", ".yaaw/state.json"]:
            self.assertIn(path, memory)
        self.assertIn("secrets", memory.lower())
        self.assertIn("Memory never overrides `.yaaw-core/**`", memory)

    def test_memory_failure_is_not_a_workflow_blocker(self):
        context = (CORE / "core/context-loading.md").read_text()
        memory = (CORE / "core/project-memory.md").read_text()
        self.assertIn("Project memory is also not a semantic source of truth", context)
        self.assertIn("Missing or failed memory retrieval is not a blocker by itself", memory)


if __name__ == "__main__":
    unittest.main()
