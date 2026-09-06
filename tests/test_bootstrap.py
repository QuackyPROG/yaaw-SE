import json
import tempfile
import unittest
from pathlib import Path

from scripts.init_project import initialize_project


class BootstrapTest(unittest.TestCase):
    def test_initialization_creates_owned_layout_and_truthful_state(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            created = initialize_project(root)
            docs = root / "docs"
            yaaw = root / ".yaaw"
            self.assertTrue(created)
            for directory in ("product", "engineering", "specs", "rules"):
                self.assertTrue((docs / directory).is_dir(), directory)
            self.assertTrue((docs / "engineering" / "decisions").is_dir())
            for directory in ("tickets", "reviews", "evidence", "runtime"):
                self.assertTrue((yaaw / directory).is_dir(), directory)
            self.assertTrue((docs / "product" / "product.md").is_file())
            self.assertTrue((docs / "engineering" / "engineering.md").is_file())
            state = json.loads((yaaw / "state.json").read_text())
            self.assertEqual(state["product"]["artifact"], "docs/product/product.md")
            self.assertEqual(state["planning"]["artifact"], "docs/engineering/engineering.md")
            self.assertEqual(state["product"]["status"], "draft")
            self.assertEqual(state["product"]["revision"], 1)
            self.assertEqual(state["planning"]["status"], "discovery")
            self.assertEqual(state["planning"]["revision"], 1)
            self.assertEqual(state["planning"]["current_frontier"], "FRONTIER-001")
            self.assertIsNone(state["last_workflow"])

    def test_initialization_is_idempotent_and_never_overwrites_artifacts(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            initialize_project(root)
            product = root / "docs" / "product" / "product.md"
            product.write_text("custom product content\n")
            second = initialize_project(root)
            self.assertEqual(second, [])
            self.assertEqual(product.read_text(), "custom product content\n")

    def test_existing_yaaw_without_docs_is_repaired(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / ".yaaw").mkdir()
            initialize_project(root)
            self.assertTrue((root / "docs" / "product" / "product.md").is_file())
            self.assertTrue((root / "docs" / "engineering" / "engineering.md").is_file())
            self.assertTrue((root / ".yaaw" / "state.json").is_file())

    def test_existing_docs_without_yaaw_is_repaired_without_overwrite(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            product_dir = root / "docs" / "product"
            product_dir.mkdir(parents=True)
            product = product_dir / "product.md"
            product.write_text("existing product\n")
            initialize_project(root)
            self.assertEqual(product.read_text(), "existing product\n")
            self.assertTrue((root / ".yaaw" / "state.json").is_file())
            self.assertTrue((root / "docs" / "engineering" / "engineering.md").is_file())

    def test_partial_canonical_tree_only_creates_missing_paths(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            engineering_dir = root / "docs" / "engineering"
            engineering_dir.mkdir(parents=True)
            engineering = engineering_dir / "engineering.md"
            engineering.write_text("existing engineering\n")
            tickets = root / ".yaaw" / "tickets"
            tickets.mkdir(parents=True)

            initialize_project(root)

            self.assertEqual(engineering.read_text(), "existing engineering\n")
            self.assertTrue((root / "docs" / "product" / "product.md").is_file())
            self.assertTrue((root / "docs" / "engineering" / "decisions").is_dir())
            self.assertTrue((root / ".yaaw" / "reviews").is_dir())
            self.assertTrue((root / ".yaaw" / "state.json").is_file())


if __name__ == "__main__":
    unittest.main()
