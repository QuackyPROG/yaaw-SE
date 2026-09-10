import json
import tomllib
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CORE = ROOT / ".yaaw-core"
SEMANTIC_ROLES = ("prd", "planner", "implementer", "reviewer")


class ContractConsistencyTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.workflows = json.loads((CORE / "registries/workflows.json").read_text())
        cls.role_io = json.loads((CORE / "registries/role-io.json").read_text())["roles"]
        cls.context = json.loads((CORE / "registries/context-policy.json").read_text())["roles"]
        cls.transitions = json.loads((CORE / "registries/transitions.json").read_text())

    def test_workflow_registry_is_exact_file_closure(self):
        registered = {entry["workflow"] for entry in self.workflows.values()}
        actual = {path.relative_to(ROOT).as_posix() for path in (CORE / "workflows").rglob("*.md")}
        self.assertEqual(actual, registered)
        for workflow_id, entry in self.workflows.items():
            text = (ROOT / entry["workflow"]).read_text()
            self.assertIn("## Purpose", text, workflow_id)
            self.assertIn("## Inputs", text, workflow_id)

    def test_semantic_roles_read_handoff_first_and_never_write_state(self):
        for role in SEMANTIC_ROLES:
            text = (CORE / "roles" / f"{role}.md").read_text()
            self.assertIn("`.yaaw/runtime/handoff.json` first", text, role)
            self.assertNotIn("state", self.role_io[role]["writes"], role)
        self.assertIn("state", self.role_io["orchestrator"]["writes"])

    def test_prd_memory_is_disabled_end_to_end(self):
        policy = self.context["prd"]
        self.assertEqual(policy["memory_mode"], "disabled")
        self.assertEqual(policy["memory_phase"], "never")
        self.assertEqual(policy["memory_target_tokens"], 0)
        forbidden = (
            "when memory is enabled",
            "permitted memory results",
            "optional historical leads",
            "historical project-memory context",
            "using memory only",
        )
        for path in (CORE / "workflows/prd").glob("*.md"):
            lower = path.read_text().lower()
            for phrase in forbidden:
                self.assertNotIn(phrase, lower, path.name)

    def test_canonical_paths_do_not_drift(self):
        forbidden = (
            ".yaaw/product.md",
            ".yaaw/engineering.md",
            ".yaaw/specs/",
            ".yaaw/rules/",
            ".yaaw/evidence/EVIDENCE-",
            ".yaaw/reviews/TASK-",
        )
        roots = [CORE / "core", CORE / "roles", CORE / "rules", CORE / "workflows", ROOT / "skills", ROOT / ".codex/agents"]
        for root in roots:
            for path in root.rglob("*"):
                if not path.is_file() or path.suffix not in {".md", ".toml"}:
                    continue
                text = path.read_text()
                for stale in forbidden:
                    self.assertNotIn(stale, text, f"{path}: {stale}")

    def test_invalidation_respects_cross_role_ownership(self):
        text = (CORE / "core/invalidation.md").read_text()
        self.assertIn("Triggering roles never mutate another role's semantic artifacts", text)
        self.assertIn("Planner applies semantic invalidation", text)
        self.assertIn("Orchestrator persists ticket lifecycle invalidation", text)
        prd = (CORE / "workflows/prd/record-decisions.md").read_text()
        self.assertNotIn("execute the invalidation policy", prd.lower())
        self.assertIn("return the invalidation requirement to Orchestrator", prd)

    def test_state_writer_is_unambiguous(self):
        self.assertTrue(all(t["state_writer"] == "orchestrator" for t in self.transitions["legal"]))
        prose = (CORE / "core/transitions.md").read_text()
        self.assertIn("semantic outcome owner", prose)
        self.assertIn("Orchestrator persists every ticket lifecycle transition", prose)
        self.assertNotIn("product/state", (CORE / "workflows/prd/readiness.md").read_text())
        self.assertNotIn("engineering.md`/state", (CORE / "workflows/planning/readiness-review.md").read_text())

    def test_implementer_precondition_reasons_are_nested(self):
        text = (CORE / "workflows/implementation/implement-ticket.md").read_text()
        self.assertIn("PRECONDITION_UNSATISFIED` with reason `SOURCE_SPEC_MISSING` or `STALE_SOURCE_REVISION`", text)
        self.assertNotIn("return `SOURCE_SPEC_MISSING` or `STALE_SOURCE_REVISION`", text)

    def test_codex_agents_resolve_exact_handoff_workflow(self):
        config = tomllib.loads((ROOT / ".codex/config.toml").read_text())
        registered = set()
        for name, registration in config["agents"].items():
            if not isinstance(registration, dict) or "config_file" not in registration:
                continue
            path = ROOT / ".codex" / registration["config_file"]
            registered.add(registration["config_file"])
            agent = tomllib.loads(path.read_text())
            instructions = agent["developer_instructions"]
            role = name.split("_", 1)[0]
            self.assertIn("Read .yaaw/runtime/handoff.json first", instructions, name)
            self.assertIn(".yaaw-core/registries/workflows.json", instructions, name)
            self.assertIn("handoff.workflow", instructions, name)
            self.assertIn(f".yaaw-core/roles/{role}.md", instructions, name)
        actual = {p.relative_to(ROOT / ".codex").as_posix() for p in (ROOT / ".codex/agents").glob("*.toml")}
        self.assertEqual(actual, registered)

    def test_ci_watches_codex_contracts(self):
        workflow = (ROOT / ".github/workflows/validate.yml").read_text()
        self.assertIn("'.codex/**'", workflow)


if __name__ == "__main__":
    unittest.main()
