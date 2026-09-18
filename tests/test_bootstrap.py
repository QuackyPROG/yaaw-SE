import json
import shutil
import subprocess
import tempfile
import unittest
from pathlib import Path

from scripts.init_project import InitializationError, initialize_project

ROOT = Path(__file__).resolve().parents[1]
CORE = ROOT / ".yaaw-core"


class BootstrapTest(unittest.TestCase):
    def git(self, root: Path, *args: str) -> None:
        subprocess.run(["git", "-C", str(root), *args], check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

    def prepare(self, root: Path) -> None:
        self.git(root, "init", "-b", "main")
        self.git(root, "config", "user.name", "YAAW Test")
        self.git(root, "config", "user.email", "yaaw@example.test")
        (root / "app.txt").write_text("base\n")
        self.git(root, "add", "app.txt")
        self.git(root, "commit", "-m", "chore: initialize application")
        shutil.copytree(CORE, root / ".yaaw-core")

    def test_initialization_creates_owned_layout_state_and_project_marker(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            self.prepare(root)
            created = initialize_project(root)
            docs = root / "docs"
            yaaw = root / ".yaaw"
            self.assertTrue(created)
            for directory in ("product", "engineering", "specs", "rules"):
                self.assertTrue((docs / directory).is_dir(), directory)
            self.assertTrue((docs / "engineering/decisions").is_dir())
            for directory in ("tickets", "reviews", "evidence", "runtime", "vcs"):
                self.assertTrue((yaaw / directory).is_dir(), directory)
            self.assertTrue((docs / "product/product.md").is_file())
            self.assertTrue((docs / "engineering/engineering.md").is_file())
            state = json.loads((yaaw / "state.json").read_text())
            self.assertEqual(state["product"]["artifact"], "docs/product/product.md")
            self.assertEqual(state["planning"]["artifact"], "docs/engineering/engineering.md")
            self.assertEqual(state["product"]["status"], "draft")
            self.assertEqual(state["planning"]["status"], "discovery")
            install = json.loads((yaaw / "install.json").read_text())
            self.assertEqual(install["mode"], "project")
            self.assertEqual(install["vcs_isolation"], "enabled")
            self.assertTrue((yaaw / "vcs.json").is_file())
            self.assertTrue((yaaw / "runtime/vcs-observed.json").is_file())

    def test_initialization_is_idempotent(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            self.prepare(root)
            initialize_project(root)
            second = initialize_project(root)
            self.assertEqual(second, [])

    def test_existing_application_owned_canonical_file_is_a_collision(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            self.prepare(root)
            product = root / "docs/product/product.md"
            product.parent.mkdir(parents=True)
            product.write_text("existing product\n")
            with self.assertRaisesRegex(InitializationError, "PATH_OWNERSHIP_CONFLICT"):
                initialize_project(root)
            self.assertEqual(product.read_text(), "existing product\n")

    def test_existing_yaaw_root_without_docs_is_repaired(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            self.prepare(root)
            (root / ".yaaw").mkdir()
            initialize_project(root)
            self.assertTrue((root / "docs/product/product.md").is_file())
            self.assertTrue((root / "docs/engineering/engineering.md").is_file())
            self.assertTrue((root / ".yaaw/state.json").is_file())


if __name__ == "__main__":
    unittest.main()
