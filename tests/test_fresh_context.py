import json
import unittest
from pathlib import Path

from scripts.validate_core import parse_frontmatter

ROOT = Path(__file__).resolve().parents[1]
CORE = ROOT / ".yaaw-core"
FIXTURE = ROOT / "tests" / "fixtures" / "fresh_context_project"
DOCS = FIXTURE / "docs"
YAAW = FIXTURE / ".yaaw"


class FreshContextConformanceTest(unittest.TestCase):
    def test_artifact_graph_reconstructs_without_chat_history(self):
        product, _ = parse_frontmatter(DOCS / "product" / "product.md")
        engineering, engineering_body = parse_frontmatter(DOCS / "engineering" / "engineering.md")
        spec, spec_body = parse_frontmatter(DOCS / "specs" / "SPEC-001.md")
        ticket, ticket_body = parse_frontmatter(YAAW / "tickets" / "SPEC-001" / "TASK-001.md")
        review, review_body = parse_frontmatter(YAAW / "reviews" / "SPEC-001" / "TASK-001" / "R1.md")
        evidence = json.loads((YAAW / "evidence" / "SPEC-001" / "TASK-001-V1.json").read_text())
        state = json.loads((YAAW / "state.json").read_text())

        self.assertEqual(engineering["product_revision"], product["revision"])
        self.assertEqual(spec["product_revision"], product["revision"])
        self.assertEqual(spec["engineering_revision"], engineering["revision"])
        self.assertIn("ENG-001", spec["decision_ids"])
        self.assertIn("ENG-001", engineering_body)

        self.assertEqual(ticket["spec"], spec["id"])
        self.assertEqual(ticket["spec_revision"], spec["revision"])
        self.assertEqual(ticket["product_revision"], product["revision"])
        self.assertEqual(ticket["engineering_revision"], engineering["revision"])
        self.assertTrue(set(ticket["decision_ids"]).issubset(set(spec["decision_ids"])))

        self.assertEqual(review["ticket"], ticket["id"])
        self.assertEqual(review["ticket_revision"], ticket["revision"])
        self.assertEqual(review["spec_revision"], spec["revision"])
        self.assertEqual(review["reviewed_head_commit"], evidence["repository"]["head_commit"])
        self.assertIn(evidence["id"], review["evidence"])

        self.assertEqual(state["product"]["revision"], product["revision"])
        self.assertEqual(state["planning"]["revision"], engineering["revision"])
        self.assertEqual(state["planning"]["active_spec"], spec["id"])
        self.assertEqual(state["tickets"][ticket["id"]], "PASS")

        combined = "\n".join([engineering_body, spec_body, ticket_body, review_body]).lower()
        self.assertNotIn("original chat", combined)
        self.assertNotIn("conversation transcript", combined)

    def test_fixture_frontmatter_covers_schema_required_fields(self):
        pairs = [
            ("product.schema.json", DOCS / "product" / "product.md"),
            ("engineering.schema.json", DOCS / "engineering" / "engineering.md"),
            ("spec.schema.json", DOCS / "specs" / "SPEC-001.md"),
            ("ticket.schema.json", YAAW / "tickets" / "SPEC-001" / "TASK-001.md"),
            ("review.schema.json", YAAW / "reviews" / "SPEC-001" / "TASK-001" / "R1.md"),
        ]
        for schema_name, artifact in pairs:
            schema = json.loads((CORE / "schemas" / schema_name).read_text())
            meta, _ = parse_frontmatter(artifact)
            self.assertTrue(set(schema["required"]).issubset(set(meta)), artifact.name)

    def test_fresh_implementer_has_exact_contract_references(self):
        ticket, _ = parse_frontmatter(YAAW / "tickets" / "SPEC-001" / "TASK-001.md")
        self.assertTrue(ticket["spec"])
        self.assertTrue(ticket["decision_ids"])
        self.assertTrue(ticket["expertise"])
        self.assertEqual(ticket["status"], "READY")

    def test_fresh_reviewer_is_bound_to_repository_and_evidence(self):
        review, _ = parse_frontmatter(YAAW / "reviews" / "SPEC-001" / "TASK-001" / "R1.md")
        self.assertTrue(review["reviewed_head_commit"])
        self.assertIsInstance(review["reviewed_dirty"], bool)
        self.assertTrue(review["reviewed_worktree_digest"])
        self.assertTrue(review["evidence"])


if __name__ == "__main__":
    unittest.main()
