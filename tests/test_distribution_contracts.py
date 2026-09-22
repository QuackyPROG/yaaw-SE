import json
import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CORE = ROOT / ".yaaw-core"


class DistributionContractsTest(unittest.TestCase):
    def test_one_root_path_registry(self):
        paths = json.loads((CORE / "registries/paths.json").read_text())
        self.assertEqual(paths["core_root"], ".yaaw-core")
        self.assertEqual(paths["project_root"], ".yaaw-core/project")
        self.assertEqual(paths["runtime_root"], ".yaaw-core/runtime")
        self.assertEqual(paths["install_root"], ".yaaw-core/install")

    def test_source_core_does_not_contain_consumer_state(self):
        for name in ("project", "runtime", "install"):
            self.assertFalse((CORE / name).exists(), name)

    def test_no_live_legacy_yaaw_root_references(self):
        legacy = re.compile(r"(?<!-)\.yaaw/")
        roots = [CORE, ROOT / "skills", ROOT / "src", ROOT / "installer"]
        for base in roots:
            for path in base.rglob("*"):
                if path.is_file() and path.suffix.lower() in {".md", ".json", ".ts"}:
                    self.assertIsNone(legacy.search(path.read_text(errors="ignore")), str(path))

    def test_provider_adapter_directories_are_generated_surfaces(self):
        for name in (".agents", ".claude", ".gemini", ".cline"):
            self.assertFalse((ROOT / name).exists(), name)

    def test_bootstraps_are_thin_and_canonical(self):
        root = ROOT / "installer" / "templates" / "bootstrap"
        for name in ("codex.md", "claude-code.md", "gemini-cli.md", "cline.md"):
            text = (root / name).read_text()
            self.assertIn(".yaaw-core/", text)
            self.assertLessEqual(len(text.splitlines()), 30)


if __name__ == "__main__":
    unittest.main()
