import json
import subprocess
import tempfile
import unittest
from pathlib import Path

from scripts.behavior_oracle import determine_next
from scripts.init_project import initialize_project
from scripts.validate_core import parse_frontmatter

ROOT = Path(__file__).resolve().parents[1]
CORE = ROOT / ".yaaw-core"


class EngineeringHardeningTest(unittest.TestCase):
    def load(self, rel):
        return json.loads((ROOT / rel).read_text())

    def test_01_research_artifact_registered(self):
        self.assertEqual(self.load(".yaaw-core/registries/artifacts.json")["artifacts"]["engineering_research"]["pattern"], "docs/engineering/research/RSH-*.md")

    def test_02_research_template_schema_agree(self):
        schema = self.load(".yaaw-core/schemas/engineering-research.schema.json")
        meta, body = parse_frontmatter(CORE / "templates/engineering-research.md")
        self.assertTrue(set(schema["required"]).issubset(meta))
        self.assertIn("## Source ledger", body)

    def test_03_bootstrap_creates_research_directory(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            subprocess.run(["git", "init", "-b", "main"], cwd=root, check=True, stdout=subprocess.DEVNULL)
            subprocess.run(["git", "config", "user.email", "test@example.com"], cwd=root, check=True)
            subprocess.run(["git", "config", "user.name", "Test"], cwd=root, check=True)
            (root / "app.txt").write_text("baseline\n")
            subprocess.run(["git", "add", "app.txt"], cwd=root, check=True)
            subprocess.run(["git", "commit", "-m", "init"], cwd=root, check=True, stdout=subprocess.DEVNULL)
            initialize_project(root)
            self.assertTrue((root / "docs/engineering/research").is_dir())

    def test_04_research_is_planner_owned(self):
        io = self.load(".yaaw-core/registries/role-io.json")["roles"]
        self.assertIn("engineering_research", io["planner"]["writes"])
        for role in ("implementer", "reviewer", "orchestrator"):
            self.assertNotIn("engineering_research", io[role]["writes"])

    def test_05_research_is_not_project_memory(self):
        self.assertNotIn("project memory", (CORE / "templates/engineering-research.md").read_text().lower())
        self.assertIn("separate from project memory", (CORE / "core/artifact-model.md").read_text().lower())

    def test_06_pending_research_routes_to_research(self):
        policy = self.load(".yaaw-core/registries/routing-policy.json")
        obs = {"state_consistent": True, "recovery_evidence_sufficient": True, "blocker": False, "product_status": "ready", "research_pending": True, "planning_status": "ready", "readiness": "PASS", "spec_status": "missing", "tickets": {}}
        self.assertEqual(determine_next(obs, policy)["workflow"], "planning.research")

    def test_07_no_public_research_skill(self):
        skills = self.load(".yaaw-core/registries/skills.json")
        self.assertNotIn("yaaw-research", skills)
        self.assertNotIn("planning.research", {v["workflow_id"] for v in skills.values()})

    def test_08_no_new_semantic_role(self):
        self.assertEqual(set(self.load(".yaaw-core/registries/role-io.json")["roles"]), {"prd", "planner", "implementer", "reviewer", "orchestrator"})

    def test_09_new_ticket_template_v2(self):
        meta, _ = parse_frontmatter(CORE / "templates/ticket.md")
        self.assertEqual(meta["contract_version"], 2)

    def test_10_v2_ticket_requires_verification_mode(self):
        schema = self.load(".yaaw-core/schemas/ticket.schema.json")
        self.assertIn("verification_mode", schema["properties"])
        self.assertIn("verification_mode", schema["allOf"][0]["then"]["required"])

    def test_11_v2_ticket_requires_slice_type(self):
        schema = self.load(".yaaw-core/schemas/ticket.schema.json")
        self.assertIn("slice_type", schema["allOf"][0]["then"]["required"])

    def test_12_legacy_ticket_remains_optional(self):
        schema = self.load(".yaaw-core/schemas/ticket.schema.json")
        self.assertNotIn("contract_version", schema["required"])

    def test_13_testing_expertise_has_seam_oracle_tautology(self):
        text = (CORE / "expertise/testing/MODULE.md").read_text().lower()
        for word in ("seam", "oracle", "tautolog"):
            self.assertIn(word, text)

    def test_14_codebase_design_registered_for_three_roles(self):
        e = self.load(".yaaw-core/registries/expertise.json")["codebase-design"]
        self.assertEqual(set(e["usable_by"]), {"planner", "implementer", "reviewer"})

    def test_15_diagnosis_is_not_acceptance_ready(self):
        self.assertIn("acceptance_ready: false", (CORE / "workflows/implementation/diagnose-ticket.md").read_text())

    def test_16_red_only_is_not_acceptance_ready(self):
        self.assertIn("RED evidence is not completion evidence", (CORE / "rules/recovery-evidence.md").read_text())

    def test_17_final_hardened_verification_can_be_ready(self):
        evidence = self.load(".yaaw-core/templates/evidence.json")
        self.assertTrue(evidence["acceptance_ready"])
        self.assertEqual(evidence["verification"]["phases"][-1]["phase"], "FINAL")

    def test_18_recovery_cannot_jump_from_diagnosis(self):
        cases = self.load("tests/fixtures/lifecycle_cases.json")["cases"]
        case = next(c for c in cases if c["id"] == "S-diagnosis-does-not-trigger-review")
        self.assertEqual(case["expected"]["workflow"], "orchestration.recover-interruption")

    def test_19_reviewer_runs_three_lenses(self):
        text = (CORE / "workflows/review/review-ticket.md").read_text()
        for wf in ("review.inspect-contract", "review.inspect-test-validity", "review.inspect-engineering-quality"):
            self.assertIn(wf, text)

    def test_20_style_only_cannot_force_failure(self):
        text = (CORE / "workflows/review/inspect-engineering-quality.md").read_text().lower()
        self.assertIn("style preference", text)
        self.assertIn("cannot fail", text)

    def test_21_planner_does_not_spawn_research_peer(self):
        text = (CORE / "workflows/planning/research.md").read_text().lower()
        self.assertIn("never spawns", text)

    def test_22_research_returns_through_orchestrator(self):
        text = (CORE / "workflows/planning/research.md").read_text()
        self.assertIn("Return the durable result to Orchestrator", text)

    def test_23_prd_workflows_stay_outside_hardening(self):
        for path in (CORE / "workflows/prd").glob("*.md"):
            text = path.read_text().lower()
            self.assertNotIn("planning.research", text)
            self.assertNotIn("diagnose-ticket", text)

    def test_24_public_skills_still_route_via_registry_contract(self):
        skills = self.load(".yaaw-core/registries/skills.json")
        workflows = self.load(".yaaw-core/registries/workflows.json")
        for entry in skills.values():
            self.assertIn(entry["workflow_id"], workflows)

    def test_25_max_depth_remains_one(self):
        self.assertIn("max_depth = 1", (ROOT / ".codex/config.toml").read_text())


if __name__ == "__main__":
    unittest.main()
