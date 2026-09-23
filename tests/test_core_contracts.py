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
        cls.execution = json.loads((CORE / "registries/execution-policy.json").read_text())
        cls.role_io = json.loads((CORE / "registries/role-io.json").read_text())
        cls.artifacts = json.loads((CORE / "registries/artifacts.json").read_text())

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
        repository = json.loads((CORE / "schemas/repository-identity.schema.json").read_text())
        self.assertEqual(repository["$id"], "yaaw.repository-identity/v2")
        review_v2 = json.loads((CORE / "schemas/review-v2.schema.json").read_text())
        evidence_v2 = json.loads((CORE / "schemas/evidence-v2.schema.json").read_text())
        self.assertIn("repository", review_v2["required"])
        self.assertIn("repository", evidence_v2["required"])
        self.assertEqual(set(review_v2["properties"]["result"]["enum"]), {"PASS", "REPAIR", "REPLAN", "BLOCKED"})
        self.assertTrue((CORE / "schemas/review-v1.schema.json").is_file())
        self.assertTrue((CORE / "schemas/evidence-v1.schema.json").is_file())

    def test_transition_contract_forbids_self_acceptance_shortcuts(self):
        text = (CORE / "core/transitions.md").read_text()
        for forbidden in ["DRAFT -> PASS", "READY -> PASS", "REPAIR_REQUIRED -> PASS"]:
            self.assertIn(forbidden, text)
        self.assertIn("PASS | REPLAN_REQUIRED", text)
        self.assertIn("PASS | REVIEW_REQUIRED", text)

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


    def test_every_workflow_has_repository_execution_policy(self):
        self.assertEqual(set(self.workflows), set(self.execution["workflows"]))
        self.assertEqual(self.execution["workflows"]["prd.route"]["repository_requirement"], "NONE")
        self.assertEqual(self.execution["workflows"]["planning.discover"]["repository_requirement"], "INSPECT")
        self.assertEqual(self.execution["workflows"]["implementation.implement-ticket"]["repository_requirement"], "IDENTITY")
        self.assertEqual(self.execution["workflows"]["review.review-ticket"]["repository_requirement"], "IDENTITY")

    def test_role_io_is_complete_and_uses_canonical_artifacts(self):
        self.assertEqual(set(self.role_io["roles"]), {"prd", "planner", "implementer", "reviewer", "orchestrator"})
        artifact_ids = set(self.artifacts) - {"schema"}
        for role, contract in self.role_io["roles"].items():
            for field in ("reads", "writes", "forbidden_writes"):
                self.assertTrue(set(contract[field]).issubset(artifact_ids), f"{role}:{field}")

    def test_research_is_internal_and_frontier_owned(self):
        self.assertIn("planning.research", self.workflows)
        self.assertNotIn("yaaw-research", self.skills)
        self.assertIn("research-admission", (CORE / "workflows/planning/decision-frontier.md").read_text())
        self.assertIn("Availability of a Codex/host skill is not an admission basis", (CORE / "rules/research-admission.md").read_text())

    def test_repository_identity_is_single_canonical_utility(self):
        self.assertTrue((CORE / "tools/repository-identity.mjs").is_file())
        rule = (CORE / "rules/repository-identity.md").read_text()
        self.assertIn("must not reimplement", rule.lower())
        self.assertIn("yaaw-worktree-v1", rule)

    def test_context_loading_is_progressive_and_git_is_root_anchored(self):
        context = (CORE / "core/context-loading.md").read_text()
        execution = (CORE / "core/execution-context.md").read_text()
        self.assertIn("must not preload sibling or downstream workflow bodies", context)
        self.assertIn("git -C <WORKSPACE_ROOT>", execution)
        self.assertIn("UNVERSIONED", execution)


    def test_framework_integrity_is_fail_closed_and_read_only(self):
        contract = (CORE / "core/framework-integrity.md").read_text()
        tool = (CORE / "tools/framework-integrity.mjs").read_text()
        self.assertIn("FRAMEWORK_INTEGRITY_VIOLATION", contract)
        self.assertIn("backup-replace", contract)
        self.assertIn('status !== "HEALTHY"', tool)
        for mutator in ("writeFile(", "rename(", "unlink(", "rm("):
            self.assertNotIn(mutator, tool)

    def test_reviewer_reads_state_but_only_writes_review(self):
        reviewer = self.role_io["roles"]["reviewer"]
        self.assertIn("state", reviewer["reads"])
        self.assertEqual(set(reviewer["writes"]), {"review"})
        self.assertIn("state", reviewer["forbidden_writes"])
        review_ticket = (CORE / "workflows/review/review-ticket.md").read_text()
        self.assertIn(".yaaw-core/project/state.json", review_ticket)
        self.assertIn("frontmatter", review_ticket.lower())

    def test_orchestrator_is_only_physical_state_writer(self):
        orchestrator = self.role_io["roles"]["orchestrator"]
        self.assertEqual(set(orchestrator["writes"]), {"state", "observed_state", "handoff", "intent"})
        self.assertIn("installation_manifest", orchestrator["reads"])
        transitions = json.loads((CORE / "registries/transitions.json").read_text())
        self.assertTrue(transitions["legal"])
        self.assertTrue(all(row.get("state_writer") == "orchestrator" for row in transitions["legal"]))
        record = (CORE / "workflows/review/record-review.md").read_text()
        self.assertIn("Reviewer writes only", record)
        self.assertIn("Orchestrator re-inspects", record)

    def test_semantic_roles_cannot_write_installation_manifest(self):
        for role, contract in self.role_io["roles"].items():
            self.assertIn("installation_manifest", contract["forbidden_writes"], role)

    def test_observed_state_records_framework_integrity(self):
        schema = json.loads((CORE / "schemas/observed-state.schema.json").read_text())
        required = set(schema["properties"]["framework"]["required"])
        self.assertTrue({"integrity_status", "modified", "missing", "local_overrides", "legacy_paths", "repair_required"}.issubset(required))
if __name__ == "__main__":
    unittest.main()
