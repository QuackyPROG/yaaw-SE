import json
import tempfile
import unittest
from pathlib import Path

from scripts.init_project import initialize_project


class BootstrapTest(unittest.TestCase):
    def test_initialization_creates_durable_layout_and_truthful_state(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            created = initialize_project(root)
            yaaw = root / ".yaaw"
            self.assertTrue(created)
            for directory in ("specs", "tickets", "reviews", "evidence", "rules", "runtime"):
                self.assertTrue((yaaw / directory).is_dir(), directory)
            self.assertTrue((yaaw / "product.md").is_file())
            self.assertTrue((yaaw / "engineering.md").is_file())
            state = json.loads((yaaw / "state.json").read_text())
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
            product = root / ".yaaw" / "product.md"
            product.write_text("custom product content\n")
            second = initialize_project(root)
            self.assertEqual(second, [])
            self.assertEqual(product.read_text(), "custom product content\n")


if __name__ == "__main__":
    unittest.main()
