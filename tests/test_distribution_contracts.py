import json
import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CORE_ROOT = ROOT / ".yaaw-core"
SYSTEM = CORE_ROOT / "system"


class DistributionContractsTest(unittest.TestCase):
    def test_one_root_path_registry(self):
        paths = json.loads((SYSTEM / "registries/paths.json").read_text())
        self.assertEqual(paths["core_root"], ".yaaw-core")
        self.assertEqual(paths["system_root"], ".yaaw-core/system")
        self.assertEqual(paths["workspace_root"], ".")
        self.assertEqual(paths["project_memory_root"], ".yaaw-core/project")
        self.assertEqual(paths["research"], ".yaaw-core/project/research")
        self.assertEqual(paths["runtime_root"], ".yaaw-core/runtime")
        self.assertEqual(paths["install_root"], ".yaaw-core/install")

    def test_source_system_is_the_only_package_managed_subtree(self):
        expected = {"core", "roles", "workflows", "expertise", "rules", "registries", "schemas", "templates", "tools"}
        self.assertEqual({p.name for p in SYSTEM.iterdir() if p.is_dir()}, expected)
        for name in expected | {"project", "runtime", "install"}:
            self.assertFalse((CORE_ROOT / name).exists(), name)

    def test_no_live_legacy_yaaw_root_references(self):
        legacy = re.compile(r"(?<!-)\.yaaw/")
        roots = [CORE_ROOT, ROOT / "skills", ROOT / "src", ROOT / "installer"]
        for base in roots:
            for path in base.rglob("*"):
                if path.is_file() and path.suffix.lower() in {".md", ".json", ".ts"}:
                    self.assertIsNone(legacy.search(path.read_text(errors="ignore")), str(path))

    def test_framework_integrity_is_package_managed(self):
        self.assertTrue((SYSTEM / "core" / "framework-integrity.md").is_file())
        self.assertTrue((SYSTEM / "tools" / "framework-integrity.mjs").is_file())

    def test_provider_adapter_directories_are_generated_surfaces(self):
        for name in (".agents", ".claude", ".gemini", ".cline"):
            self.assertFalse((ROOT / name).exists(), name)

    def test_bootstraps_are_thin_and_canonical(self):
        root = ROOT / "installer" / "templates" / "bootstrap"
        for name in ("codex.md", "claude-code.md", "gemini-cli.md", "cline.md"):
            text = (root / name).read_text()
            self.assertIn(".yaaw-core/system/", text)
            self.assertLessEqual(len(text.splitlines()), 30)


if __name__ == "__main__":
    unittest.main()
