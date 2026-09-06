import json
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CORE = ROOT / ".yaaw-core"


class IORoutingContractsTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.artifacts = json.loads((CORE / "registries/artifacts.json").read_text())["artifacts"]
        cls.role_io = json.loads((CORE / "registries/role-io.json").read_text())["roles"]
        cls.skills = json.loads((CORE / "registries/skills.json").read_text())

    def test_canonical_artifact_paths_are_machine_locked(self):
        expected = {
            "product": "docs/product/product.md",
            "engineering": "docs/engineering/engineering.md",
            "spec": "docs/specs/<SPEC-ID>.md",
            "ticket": ".yaaw/tickets/<SPEC-ID>/<TASK-ID>.md",
            "evidence": ".yaaw/evidence/<SPEC-ID>/<TASK-ID>-V<VERSION>.json",
            "review": ".yaaw/reviews/<SPEC-ID>/<TASK-ID>/R<ROUND>.md",
            "intent": ".yaaw/runtime/intent.json",
            "handoff": ".yaaw/runtime/handoff.json",
            "state": ".yaaw/state.json",
        }
        for artifact, pattern in expected.items():
            self.assertEqual(self.artifacts[artifact]["pattern"], pattern)

    def test_role_io_covers_all_authority_roles(self):
        self.assertEqual(set(self.role_io), {"prd", "planner", "implementer", "reviewer", "orchestrator"})
        self.assertEqual(self.role_io["implementer"]["writes"], ["application_files", "evidence"])
        self.assertEqual(self.role_io["reviewer"]["writes"], ["review"])
        self.assertIn("ticket", self.role_io["planner"]["writes"])
        self.assertIn("state", self.role_io["orchestrator"]["writes"])

    def test_every_public_skill_enters_orchestrator_with_intent(self):
        for skill, entry in self.skills.items():
            self.assertEqual(entry["role"], "orchestrator", skill)
            self.assertEqual(entry["workflow_id"], "orchestration.route", skill)
            self.assertTrue(entry["desired_intent"], skill)
            body = (ROOT / "skills" / skill / "SKILL.md").read_text()
            self.assertIn(f"INTENT: `{entry['desired_intent']}`", body, skill)

    def test_handoff_requires_exact_io_and_desired_intent(self):
        schema = json.loads((CORE / "schemas/handoff.schema.json").read_text())
        required = set(schema["required"])
        self.assertTrue({"desired_intent", "reads", "writes", "forbidden_writes", "expected_results"}.issubset(required))
        template = json.loads((CORE / "templates/handoff.json").read_text())
        self.assertTrue(required.issubset(template))
        self.assertIn(".yaaw/tickets/SPEC-001/TASK-001.md", template["reads"])

    def test_implementer_cannot_run_without_ticket_and_never_spawns_planner(self):
        role = (CORE / "roles/implementer.md").read_text()
        workflow = (CORE / "workflows/implementation/implement-ticket.md").read_text()
        routing = (CORE / "core/routing.md").read_text()
        self.assertIn("NO_READY_TICKET", role)
        self.assertIn("NO_READY_TICKET", workflow)
        self.assertIn("never spawns Planner", role)
        self.assertIn("Missing ticket is a planning prerequisite", routing)
        self.assertIn("readiness PASS but no spec", routing)
        self.assertIn("accepted spec but no executable ticket", routing)

    def test_evidence_and_review_workflows_use_canonical_grouping(self):
        verify = (CORE / "workflows/implementation/verify-ticket.md").read_text()
        record = (CORE / "workflows/review/record-review.md").read_text()
        self.assertIn(".yaaw/evidence/<SPEC-ID>/<TASK-ID>-V<VERSION>.json", verify)
        self.assertIn(".yaaw/reviews/<SPEC-ID>/<TASK-ID>/R<ROUND>.md", record)

    def test_semantic_roles_return_to_orchestrator_and_do_not_write_state(self):
        for role in ("prd", "planner", "implementer", "reviewer"):
            text = (CORE / "roles" / f"{role}.md").read_text()
            self.assertIn("## Reads", text)
            self.assertIn("## Writes", text)
            self.assertIn("## Must not write", text)
            self.assertIn("Orchestrator", text)
            self.assertIn(".yaaw/state.json", text)

    def test_no_legacy_runtime_artifact_paths_remain(self):
        forbidden = [
            ".yaaw/product.md",
            ".yaaw/engineering.md",
            ".yaaw/specs/",
            ".yaaw/evidence/EVIDENCE-",
            ".yaaw/reviews/TASK-",
        ]
        roots = [CORE / "roles", CORE / "workflows", ROOT / "skills"]
        for root in roots:
            for path in root.rglob("*.md"):
                text = path.read_text()
                for legacy in forbidden:
                    self.assertNotIn(legacy, text, f"{path}: {legacy}")

    def test_ticket_transitions_are_persisted_by_orchestrator(self):
        transitions = json.loads((CORE / "registries/transitions.json").read_text())
        self.assertTrue(transitions["legal"])
        self.assertTrue(all(t["state_writer"] == "orchestrator" for t in transitions["legal"]))


if __name__ == "__main__":
    unittest.main()
