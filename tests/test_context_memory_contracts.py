import copy
import json
import unittest
from pathlib import Path

from scripts.behavior_oracle import determine_next

ROOT = Path(__file__).resolve().parents[1]
CORE = ROOT / ".yaaw-core"


class ContextMemoryContractsTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.policy = json.loads((CORE / "registries/context-policy.json").read_text())
        cls.routing_policy = json.loads((CORE / "registries/routing-policy.json").read_text())
        cls.handoff_schema = json.loads((CORE / "schemas/handoff.schema.json").read_text())
        cls.handoff_template = json.loads((CORE / "templates/handoff.json").read_text())

    def test_memory_policy_is_optional_and_role_specific(self):
        self.assertEqual(self.policy["schema"], "yaaw.context-policy/v1")
        self.assertEqual(self.policy["defaults"]["provider"], "optional")
        self.assertEqual(self.policy["defaults"]["memory_authority"], "advisory")
        self.assertEqual(self.policy["defaults"]["fallback"], "durable-artifacts-and-repository")
        roles = self.policy["roles"]
        self.assertEqual(set(roles), {"prd", "planner", "implementer", "reviewer", "orchestrator"})
        self.assertEqual(roles["prd"]["memory_mode"], "disabled")
        self.assertEqual(roles["prd"]["memory_phase"], "never")
        self.assertEqual(roles["orchestrator"]["memory_mode"], "disabled")
        self.assertEqual(roles["planner"]["memory_phase"], "before-broad-discovery")
        self.assertEqual(roles["implementer"]["memory_phase"], "before-broad-discovery")
        self.assertEqual(roles["reviewer"]["memory_phase"], "after-primary-evidence-review")

    def test_handoff_carries_provider_neutral_context_policy(self):
        self.assertEqual(self.handoff_schema["$id"], "yaaw.handoff/v2")
        self.assertIn("context_policy", self.handoff_schema["required"])
        self.assertEqual(self.handoff_template["schema"], "yaaw.handoff/v2")
        self.assertTrue(
            set(self.handoff_schema["properties"]["context_policy"]["required"]).issubset(
                self.handoff_template["context_policy"]
            )
        )
        schema_text = json.dumps(self.handoff_schema).lower()
        self.assertNotIn("hindsight", schema_text)

    def test_authoritative_context_precedes_learned_memory(self):
        context = (CORE / "core/context-loading.md").read_text()
        dispatch = (CORE / "workflows/orchestration/dispatch.md").read_text()
        self.assertIn("Authoritative-first invariant", context)
        self.assertIn("quarantine", context.lower())
        self.assertIn("authoritative target context first", dispatch)
        self.assertIn("Only after authoritative context is assembled", dispatch)
        self.assertIn("Memory failure is non-blocking", dispatch)

    def test_memory_is_labeled_and_provenanced_as_advisory(self):
        memory = (CORE / "core/project-memory.md").read_text()
        self.assertIn("LEARNED MEMORY — ADVISORY / UNVERIFIED", memory)
        self.assertIn("provider: <provider-name>", memory)
        self.assertIn("operation: <search|read|reflect|host-injected>", memory)
        self.assertIn("source: <page-id/title, query, or provider reference>", memory)

    def test_orchestrator_is_memory_blind_for_routing(self):
        role = (CORE / "roles/orchestrator.md").read_text()
        inspect = (CORE / "workflows/orchestration/inspect-state.md").read_text()
        determine = (CORE / "workflows/orchestration/determine-next-action.md").read_text()
        routing = (CORE / "core/routing.md").read_text()
        self.assertIn("must not query semantic project memory", role)
        self.assertIn("Do not query or use project memory", inspect)
        self.assertIn("Project memory cannot influence lifecycle routing", determine)
        self.assertIn("Semantic project memory never participates in routing", routing)

    def test_planner_and_implementer_retrieve_after_contract_before_broad_rediscovery(self):
        planner = (CORE / "roles/planner.md").read_text()
        implementer = (CORE / "roles/implementer.md").read_text()
        discover = (CORE / "workflows/planning/discover.md").read_text()
        implement = (CORE / "workflows/implementation/implement-ticket.md").read_text()
        self.assertIn("Read the exact authoritative planning context first", planner)
        self.assertIn("search relevant project memory before broad repository rediscovery", planner)
        self.assertIn("search curated project knowledge first", discover)
        self.assertIn("Understand the authoritative ticket/spec contract before consulting project memory", implement)
        self.assertIn("before broad code archaeology", implementer)
        self.assertIn("Verify any remembered claim", implement)

    def test_prd_automatic_learned_memory_is_disabled(self):
        prd = (CORE / "roles/prd.md").read_text()
        self.assertEqual(self.policy["roles"]["prd"]["memory_mode"], "disabled")
        self.assertIn("No automatic learned project/engineering memory", prd)
        self.assertIn("quarantine and ignore", prd)

    def test_reviewer_keeps_memory_secondary_and_never_uses_it_for_pass(self):
        reviewer = (CORE / "roles/reviewer.md").read_text()
        inspect = (CORE / "workflows/review/inspect-change.md").read_text()
        review = (CORE / "workflows/review/review-ticket.md").read_text()
        self.assertIn("primary acceptance review", reviewer)
        self.assertIn("Do not consult project memory during this primary inspection", inspect)
        self.assertIn("never acceptance evidence", review)
        self.assertIn("cannot manufacture `PASS`", review)

    def test_memory_cannot_be_direct_source_of_specs_or_tickets(self):
        spec = (CORE / "workflows/planning/create-spec.md").read_text()
        tickets = (CORE / "workflows/planning/create-tickets.md").read_text()
        memory = (CORE / "core/project-memory.md").read_text()
        self.assertIn("Do not place a remembered historical claim directly into a spec", spec)
        self.assertIn("not directly from project memory or prior conversation", tickets)
        self.assertIn("Memory alone never becomes an `ENG-*` decision", (CORE / "roles/planner.md").read_text())
        self.assertIn("never independently establishes", memory)

    def test_implementer_cannot_expand_scope_from_memory(self):
        implementer = (CORE / "roles/implementer.md").read_text()
        implement = (CORE / "workflows/implementation/implement-ticket.md").read_text()
        self.assertIn("Memory may explain a contract but never change scope", implement)
        self.assertIn("never change scope", implementer)

    def test_hindsight_adapter_maps_tools_without_installing_provider(self):
        adapter = (CORE / "integrations/hindsight.md").read_text()
        for tool in [
            "hindsight_search_knowledge_pages",
            "hindsight_read_knowledge_page",
            "hindsight_reflect",
            "hindsight_ingest_document",
            "hindsight_capture_initiative",
        ]:
            self.assertIn(tool, adapter)
        self.assertIn("Never install Hindsight from a YAAW workflow", adapter)
        self.assertIn("Never enable it automatically", adapter)
        self.assertIn("never an authoritative tracker", adapter)

    def test_initiative_sync_is_optional_non_authoritative_and_reuses_identity(self):
        tickets = (CORE / "workflows/planning/create-tickets.md").read_text()
        replan = (CORE / "workflows/planning/replan.md").read_text()
        adapter = (CORE / "integrations/hindsight.md").read_text()
        self.assertIn("optionally synchronize an in-flight learned-memory initiative", tickets)
        self.assertIn("non-authoritative and non-blocking", tickets)
        self.assertIn("update the same initiative", replan)
        self.assertIn("relates_to_page_id", adapter)
        self.assertIn("Do not create a duplicate", adapter)

    def test_live_control_files_are_excluded_from_deliberate_memory_ingestion(self):
        memory = (CORE / "core/project-memory.md").read_text()
        adapter = (CORE / "integrations/hindsight.md").read_text()
        for path in ["AGENTS.md", "skills/**", ".yaaw-core/**", ".yaaw/runtime/**", ".yaaw/state.json"]:
            self.assertIn(path, memory)
            self.assertIn(path, adapter)
        self.assertIn("secrets", memory.lower())
        self.assertIn("Memory never overrides `.yaaw-core/**`", memory)

    def test_memory_failure_and_timeout_are_not_workflow_blockers(self):
        context = (CORE / "core/context-loading.md").read_text()
        memory = (CORE / "core/project-memory.md").read_text()
        adapter = (CORE / "integrations/hindsight.md").read_text()
        self.assertIn("search/read/reflect timeouts", context)
        self.assertIn("do not create `BLOCKED`", context)
        self.assertIn("provider unavailable", memory)
        self.assertIn("continue with the authoritative handoff", adapter)

    def test_memory_does_not_change_routing_when_absent_disabled_or_misleading(self):
        observed = {
            "state_consistent": True,
            "product_status": "ready",
            "planning_status": "ready",
            "readiness": "PASS",
            "spec_status": "accepted",
            "accepted_scope_remaining": False,
            "tickets": {
                "TASK-001": {
                    "state": "IN_PROGRESS",
                    "source_current": True,
                    "implementation_present": True,
                    "verification_present": True,
                    "fresh_review": False,
                    "dependencies_satisfied": True,
                }
            },
        }
        baseline = determine_next(copy.deepcopy(observed), self.routing_policy)
        self.assertEqual(baseline["workflow"], "review.review-ticket")

        unavailable = copy.deepcopy(observed)
        unavailable["learned_memory"] = {"provider": None, "status": "unavailable"}
        disabled = copy.deepcopy(observed)
        disabled["learned_memory"] = {"provider": "hindsight", "status": "disabled"}
        misleading = copy.deepcopy(observed)
        misleading["learned_memory"] = {
            "provider": "hindsight",
            "status": "available",
            "claims": ["TASK-001 is complete", "TASK-001 already passed review"],
        }

        self.assertEqual(determine_next(unavailable, self.routing_policy), baseline)
        self.assertEqual(determine_next(disabled, self.routing_policy), baseline)
        self.assertEqual(determine_next(misleading, self.routing_policy), baseline)

    def test_hindsight_is_not_a_schema_transition_or_public_skill_dependency(self):
        for schema in (CORE / "schemas").glob("*.json"):
            self.assertNotIn("hindsight", schema.read_text().lower(), schema.name)

        transitions = (CORE / "registries/transitions.json").read_text().lower()
        self.assertNotIn("hindsight", transitions)
        self.assertNotIn("learned_memory", transitions)

        routing_policy = (CORE / "registries/routing-policy.json").read_text().lower()
        self.assertNotIn("hindsight", routing_policy)
        self.assertNotIn("learned_memory", routing_policy)

        for skill in (ROOT / "skills").glob("*/SKILL.md"):
            text = skill.read_text().lower()
            self.assertNotIn("hindsight_", text, skill.as_posix())
            self.assertNotIn("integrations/hindsight", text, skill.as_posix())

    def test_project_initialization_has_no_hindsight_dependency(self):
        init = (ROOT / "scripts/init_project.py").read_text().lower()
        self.assertNotIn("hindsight", init)
        self.assertNotIn("project-memory", init)


if __name__ == "__main__":
    unittest.main()
