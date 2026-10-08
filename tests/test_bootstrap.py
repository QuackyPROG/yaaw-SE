import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
INITIALIZER = ROOT / "src" / "installer" / "project-state.ts"
SYSTEM = ROOT / ".yaaw-core" / "system"


class BootstrapTest(unittest.TestCase):
    def test_installer_initialization_uses_one_root_and_no_global_state(self):
        text = INITIALIZER.read_text(encoding="utf-8")
        self.assertIn('join(projectRoot, ".yaaw-core", "project")', text)
        self.assertIn('join(projectRoot, ".yaaw-core", "runtime")', text)
        self.assertIn('join(projectRoot, ".yaaw-core", "install")', text)
        for directory in ("research", "specs", "tickets", "reviews", "evidence", "rules"):
            self.assertIn(f'join(project, "{directory}")', text)
        self.assertNotIn('join(project, "state.json")', text)
        self.assertIn("No global project state file is initialized", text)

    def test_initialization_only_seeds_missing_product_and_engineering(self):
        text = INITIALIZER.read_text(encoding="utf-8")
        self.assertEqual(text.count('type: "write-project-file-if-missing"'), 1)
        self.assertIn('[["product.md","product.md"],["engineering.md","engineering.md"]]', text)
        self.assertTrue((SYSTEM / "templates" / "product.md").is_file())
        self.assertTrue((SYSTEM / "templates" / "engineering.md").is_file())
        self.assertFalse((SYSTEM / "templates" / "project-state.json").exists())

    def test_source_checkout_initializer_was_removed(self):
        self.assertFalse((ROOT / "scripts" / "init_project.py").exists())
        for path in (ROOT / "installer" / "templates" / "bootstrap").glob("*.md"):
            self.assertNotIn("scripts/init_project.py", path.read_text(encoding="utf-8"))


if __name__ == "__main__":
    unittest.main()
