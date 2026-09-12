import json
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CORE = ROOT / ".yaaw-core"
RULE = CORE / "rules" / "assumption-challenge.md"


def read(rel: str) -> str:
    return (ROOT / rel).read_text(encoding="utf-8")


class AssumptionChallengeContractTest(unittest.TestCase):
    def test_canonical_rule_exists_and_remains_internal_only(self):
        self.assertTrue(RULE.is_file())
        skills = json.loads((CORE / "registries" / "skills.json").read_text())
        workflows = json.loads((CORE / "registries" / "workflows.json").read_text())
        self.assertNotIn("yaaw-grill", skills)
        self.assertNotIn("yaaw-challenge", skills)
        self.assertNotIn("prd.grill", workflows)
        self.assertNotIn("planning.grill", workflows)
        self.assertFalse((ROOT / "skills" / "yaaw-grill").exists())
        self.assertFalse((ROOT / "skills" / "yaaw-challenge").exists())

    def test_canonical_rule_covers_reasoning_and_over_grilling_guards(self):
        text = RULE.read_text(encoding="utf-8").lower()
        for marker in [
            "facts before questions",
            "material assumptions",
            "contradictions",
            "ambiguous terminology",
            "stress-test concrete scenarios",
            "decision dependencies",
            "current frontier",
            "future fog",
            "recommendation:",
            "do not delegate owned decisions",
            "persist accepted conclusions",
            "conversation transcript",
            "recompute the frontier",
            "zero questions is valid",
            "do not challenge a settled decision merely to demonstrate rigor",
            "do not reopen accepted decisions without new evidence, contradiction, changed intent, or explicit human request",
        ]:
            self.assertIn(marker, text)

    def test_prd_consumes_rule_without_technicalizing_product_authority(self):
        role = read(".yaaw-core/roles/prd.md").lower()
        question = read(".yaaw-core/workflows/prd/question-round.md").lower()
        self.assertIn("rules/assumption-challenge.md", role)
        self.assertIn("product assumptions", role)
        self.assertIn("must not decide engineering implementation decisions", role)
        self.assertIn("rules/assumption-challenge.md", question)
        self.assertIn("rules/question-format.md", question)
        self.assertIn("exclude engineering-only questions", question)
        self.assertIn("prerequisites", question)

    def test_planner_consumes_rule_and_keeps_repository_facts_as_agent_work(self):
        role = read(".yaaw-core/roles/planner.md").lower()
        discover = read(".yaaw-core/workflows/planning/discover.md").lower()
        question = read(".yaaw-core/workflows/planning/question-round.md").lower()
        self.assertIn("repository evidence before questioning", role)
        self.assertIn("engineering assumptions", role)
        self.assertIn("routine reversible implementation decisions", role)
        self.assertIn("never invent product intent", role)
        self.assertIn("do not ask the user anything yet", discover)
        self.assertIn("eliminate questions answerable from repository facts", question)
        self.assertIn("future fog", question)
        self.assertIn("rules/question-format.md", question)

    def test_frontier_and_recording_preserve_durable_fresh_context(self):
        frontier = read(".yaaw-core/workflows/planning/decision-frontier.md").lower()
        recording = read(".yaaw-core/workflows/planning/record-decisions.md").lower()
        product_recording = read(".yaaw-core/workflows/prd/record-decisions.md").lower()
        understanding = read(".yaaw-core/workflows/planning/write-understanding.md").lower()
        self.assertIn("known decisions", frontier)
        self.assertIn("current frontier", frontier)
        self.assertIn("future fog", frontier)
        self.assertIn("prerequisites", frontier)
        self.assertIn("product_gap", recording)
        self.assertIn("supersede", recording)
        self.assertIn("recompute", recording)
        self.assertIn("conclusions rather than the challenge/question transcript", recording)
        self.assertIn("conclusions rather than challenge/question transcripts", product_recording)
        self.assertIn("never store challenge/debate transcripts", understanding)
        self.assertNotIn("challenge log", understanding.split("rather than adding a challenge log", 1)[-1])

    def test_question_quality_contract_prefers_fewer_questions_and_free_form_answers(self):
        question_format = read(".yaaw-core/rules/question-format.md").lower()
        prd_question = read(".yaaw-core/workflows/prd/question-round.md").lower()
        planning_question = read(".yaaw-core/workflows/planning/question-round.md").lower()
        self.assertIn("at most 10", question_format)
        self.assertIn("maximum is not a target", question_format)
        self.assertIn("zero questions is valid", question_format)
        self.assertIn("recommendation:", question_format)
        self.assertIn("free-form answers are first-class", question_format)
        self.assertIn("prefer fewer high-leverage questions", prd_question)
        self.assertIn("prefer fewer high-leverage questions", planning_question)

    def test_authority_separation_excludes_orchestrator_implementer_and_reviewer(self):
        for rel in [
            ".yaaw-core/roles/orchestrator.md",
            ".yaaw-core/roles/implementer.md",
            ".yaaw-core/roles/reviewer.md",
        ]:
            self.assertNotIn("assumption-challenge", read(rel).lower(), rel)
        self.assertIn("traffic controller, not a super-agent", read(".yaaw-core/roles/orchestrator.md").lower())
        self.assertIn("missing material decisions route back to planner", read(".yaaw-core/roles/implementer.md").lower())
        reviewer = read(".yaaw-core/roles/reviewer.md").lower()
        self.assertIn("independent acceptance judgment", reviewer)
        self.assertIn("replan", reviewer)


if __name__ == "__main__":
    unittest.main()
