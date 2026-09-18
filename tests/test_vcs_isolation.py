import importlib.util
import json
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

from scripts.init_project import InitializationError, initialize_project

ROOT = Path(__file__).resolve().parents[1]
CORE = ROOT / ".yaaw-core"
GUARD_PATH = CORE / "vcs" / "guard.py"

_spec = importlib.util.spec_from_file_location("yaaw_vcs_guard_tests", GUARD_PATH)
guard = importlib.util.module_from_spec(_spec)
assert _spec and _spec.loader
sys.modules[_spec.name] = guard
_spec.loader.exec_module(guard)


class VcsIsolationTests(unittest.TestCase):
    def git(self, root: Path, *args: str, check: bool = True) -> subprocess.CompletedProcess[str]:
        proc = subprocess.run(
            ["git", "-C", str(root), *args],
            text=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            check=False,
        )
        if check and proc.returncode != 0:
            self.fail(f"git {' '.join(args)} failed: {proc.stderr or proc.stdout}")
        return proc

    def make_repo(self, root: Path, *, gitignore: str | None = None) -> None:
        self.git(root, "init", "-b", "main")
        self.git(root, "config", "user.name", "YAAW Test")
        self.git(root, "config", "user.email", "yaaw@example.test")
        if gitignore is not None:
            (root / ".gitignore").write_text(gitignore, encoding="utf-8")
        (root / "app.txt").write_text("base\n", encoding="utf-8")
        self.git(root, "add", "app.txt")
        if gitignore is not None:
            self.git(root, "add", ".gitignore")
        self.git(root, "commit", "-m", "chore: initialize application")

    def install_core(self, root: Path) -> None:
        shutil.copytree(CORE, root / ".yaaw-core")

    def make_consumer(self, root: Path, *, gitignore: str | None = None) -> None:
        self.make_repo(root, gitignore=gitignore)
        self.install_core(root)
        initialize_project(root)

    def test_bootstrap_is_local_idempotent_and_does_not_touch_gitignore(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            original = "*.cache\n"
            self.make_repo(root, gitignore=original)
            self.install_core(root)

            first = initialize_project(root)
            second = initialize_project(root)

            self.assertTrue(first)
            self.assertEqual(second, [])
            self.assertEqual((root / ".gitignore").read_text(encoding="utf-8"), original)
            self.assertEqual(json.loads((root / ".yaaw/install.json").read_text())["mode"], "consumer")
            self.assertEqual(json.loads((root / ".yaaw/vcs.json").read_text())["publish_branches"], ["main"])
            common = guard.git_common_dir(root)
            exclude = (common / "info/exclude").read_text()
            self.assertEqual(exclude.count(guard.MANAGED_EXCLUDE_START), 1)
            self.assertIn(".yaaw/", exclude)
            self.assertIn(".yaaw-core/", exclude)
            self.assertEqual(self.git(root, "config", "--local", "--get", "push.default").stdout.strip(), "nothing")
            for name in ("pre-commit", "commit-msg", "pre-push"):
                text = (common / "hooks" / name).read_text()
                self.assertEqual(text.count(guard.HOOK_MARKER), 1)

            status = self.git(root, "status", "--porcelain", "--untracked-files=all").stdout
            self.assertNotIn(".yaaw", status)
            self.assertNotIn(".yaaw-core", status)
            self.assertNotIn("docs/product/product.md", status)
            self.assertNotIn("docs/engineering/engineering.md", status)

    def test_shared_path_collision_fails_before_adoption(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            self.make_repo(root)
            self.install_core(root)
            product = root / "docs/product/product.md"
            product.parent.mkdir(parents=True)
            product.write_text("# Application-owned product document\n", encoding="utf-8")
            with self.assertRaisesRegex(InitializationError, "PATH_OWNERSHIP_CONFLICT"):
                initialize_project(root)
            self.assertEqual(product.read_text(), "# Application-owned product document\n")

    def test_forced_protected_staging_and_mixed_staging_are_rejected(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            self.make_consumer(root)
            (root / "app.txt").write_text("changed\n", encoding="utf-8")
            self.git(root, "add", "app.txt")
            self.git(root, "add", "-f", ".yaaw/state.json")
            proc = self.git(root, "commit", "-m", "fix: update application", check=False)
            self.assertNotEqual(proc.returncode, 0)
            self.assertIn("VCS_POLICY_VIOLATION", proc.stderr)
            self.git(root, "reset", "HEAD", "--", "app.txt", ".yaaw/state.json")

    def test_commit_message_guard_rejects_internal_ids_and_accepts_application_summary(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            self.make_consumer(root)
            (root / "app.txt").write_text("changed\n", encoding="utf-8")
            self.git(root, "add", "app.txt")
            bad = self.git(root, "commit", "-m", "TASK-004 complete", check=False)
            self.assertNotEqual(bad.returncode, 0)
            self.assertIn("workflow identity", bad.stderr)
            good = self.git(root, "commit", "-m", "fix: prevent duplicate import processing", check=False)
            self.assertEqual(good.returncode, 0, good.stderr)

    def test_checkpoint_commit_uses_exact_paths_and_application_message(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            self.make_consumer(root)
            (root / "app.txt").write_text("checkpoint\n", encoding="utf-8")
            checkpoint = root / ".yaaw/vcs/checkpoints/TASK-001/C1.json"
            checkpoint.parent.mkdir(parents=True, exist_ok=True)
            checkpoint.write_text(json.dumps({
                "schema": "yaaw.commit-checkpoint/v1",
                "ticket": "TASK-001",
                "checkpoint": 1,
                "paths": ["app.txt"],
                "message": "fix: make retries bounded",
                "base_commit": self.git(root, "rev-parse", "HEAD").stdout.strip(),
                "expected_result": "local_commit",
            }), encoding="utf-8")
            commit = guard.create_checkpoint_commit(root, checkpoint)
            self.assertEqual(commit, self.git(root, "rev-parse", "HEAD").stdout.strip())
            self.assertEqual(self.git(root, "show", "-s", "--format=%s").stdout.strip(), "fix: make retries bounded")
            self.assertEqual(guard.staged_paths(root), [])

    def test_publishable_identity_ignores_yaaw_mutation_but_tracks_application_change(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            self.make_consumer(root)
            baseline = guard.publishable_identity(root)
            state = root / ".yaaw/state.json"
            state.write_text(state.read_text() + "\n", encoding="utf-8")
            after_control = guard.publishable_identity(root)
            self.assertEqual(after_control.publishable_worktree_digest, baseline.publishable_worktree_digest)
            self.assertFalse(after_control.dirty_publishable)

            (root / "app.txt").write_text("publishable change\n", encoding="utf-8")
            after_app = guard.publishable_identity(root)
            self.assertTrue(after_app.dirty_publishable)
            self.assertNotEqual(after_app.publishable_worktree_digest, baseline.publishable_worktree_digest)

    def test_branch_publication_allowlist_rejects_every_topic_ref_mapping(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            self.make_consumer(root)
            sha = self.git(root, "rev-parse", "HEAD").stdout.strip()
            forbidden_pairs = (
                ("refs/heads/feature/auth", "refs/heads/feature/auth"),
                ("refs/heads/feature/auth", "refs/heads/main"),
                ("refs/heads/main", "refs/heads/feature/auth"),
            )
            for local_ref, remote_ref in forbidden_pairs:
                with self.subTest(local_ref=local_ref, remote_ref=remote_ref):
                    with self.assertRaisesRegex(guard.VcsGuardError, guard.PUBLICATION_NOT_ALLOWED):
                        guard.pre_push(root, f"{local_ref} {sha} {remote_ref} {guard.ZERO_SHA}\n")
            # main -> main is structurally allowed when history is clean.
            guard.pre_push(root, f"refs/heads/main {sha} refs/heads/main {guard.ZERO_SHA}\n")

    def test_explicit_staging_branch_is_allowed_only_after_local_configuration(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            self.make_consumer(root)
            self.git(root, "branch", "staging")
            sha = self.git(root, "rev-parse", "staging").stdout.strip()
            with self.assertRaisesRegex(guard.VcsGuardError, guard.PUBLICATION_NOT_ALLOWED):
                guard._assert_allowed_branch_pair(root, "refs/heads/staging", "refs/heads/staging")
            config = json.loads((root / ".yaaw/vcs.json").read_text())
            config["publish_branches"].append("staging")
            (root / ".yaaw/vcs.json").write_text(json.dumps(config, indent=2) + "\n")
            self.assertEqual(
                guard._assert_allowed_branch_pair(root, "refs/heads/staging", "refs/heads/staging"),
                "staging",
            )
            self.assertTrue(sha)

    def test_existing_hooks_are_chained_not_destroyed(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            self.make_repo(root)
            self.install_core(root)
            hooks = root / ".git/hooks"
            (hooks / "pre-commit").write_text("#!/bin/sh\nprintf pre-commit > .existing-pre-commit\n", encoding="utf-8")
            (hooks / "commit-msg").write_text("#!/bin/sh\nprintf commit-msg > .existing-commit-msg\n", encoding="utf-8")
            (hooks / "pre-push").write_text("#!/bin/sh\ncat >/dev/null\nprintf pre-push > .existing-pre-push\n", encoding="utf-8")
            for name in ("pre-commit", "commit-msg", "pre-push"):
                (hooks / name).chmod(0o755)

            initialize_project(root)
            for name in ("pre-commit", "commit-msg", "pre-push"):
                self.assertTrue((hooks / f"{name}.yaaw-original").is_file(), name)

            (root / "app.txt").write_text("hook chain\n", encoding="utf-8")
            self.git(root, "add", "app.txt")
            self.git(root, "commit", "-m", "fix: exercise existing hooks")
            self.assertTrue((root / ".existing-pre-commit").is_file())
            self.assertTrue((root / ".existing-commit-msg").is_file())

            sha = self.git(root, "rev-parse", "HEAD").stdout.strip()
            wrapper = hooks / "pre-push"
            proc = subprocess.run(
                [str(wrapper), "origin", "unused"],
                cwd=root,
                input=f"refs/heads/main {sha} refs/heads/main {guard.ZERO_SHA}\n",
                text=True,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                check=False,
            )
            self.assertEqual(proc.returncode, 0, proc.stderr)
            self.assertTrue((root / ".existing-pre-push").is_file())

    def test_custom_core_hookspath_fails_closed(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            self.make_repo(root)
            self.install_core(root)
            self.git(root, "config", "--local", "core.hooksPath", ".githooks")
            with self.assertRaisesRegex(InitializationError, guard.HOOK_INSTALL_CONFLICT):
                initialize_project(root)

    def test_linked_worktree_uses_common_guard_snapshot(self):
        with tempfile.TemporaryDirectory() as tmp, tempfile.TemporaryDirectory() as wt_tmp:
            root = Path(tmp)
            worktree = Path(wt_tmp) / "feature"
            self.make_consumer(root)
            self.git(root, "worktree", "add", "-b", "feature/local", str(worktree), "main")
            (worktree / "feature.txt").write_text("feature\n", encoding="utf-8")
            self.git(worktree, "add", "feature.txt")
            commit = self.git(worktree, "commit", "-m", "feat: add worktree feature", check=False)
            self.assertEqual(commit.returncode, 0, commit.stderr)
            self.assertTrue(all(guard.hook_health(worktree).values()))
            sha = self.git(worktree, "rev-parse", "HEAD").stdout.strip()
            with self.assertRaisesRegex(guard.VcsGuardError, guard.PUBLICATION_NOT_ALLOWED):
                guard.pre_push(
                    worktree,
                    f"refs/heads/feature/local {sha} refs/heads/feature/local {guard.ZERO_SHA}\n",
                )

    def test_local_history_contamination_is_detected_without_rewrite(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            self.make_repo(root)
            yaaw = root / ".yaaw"
            yaaw.mkdir()
            (yaaw / "state.json").write_text("{}\n")
            self.git(root, "add", ".yaaw/state.json")
            self.git(root, "commit", "-m", "chore: accidental local metadata")
            self.git(root, "rm", ".yaaw/state.json")
            self.git(root, "commit", "-m", "chore: remove accidental metadata")
            self.install_core(root)
            with self.assertRaisesRegex(InitializationError, guard.LOCAL_HISTORY_CONTAMINATION):
                initialize_project(root)

    def test_remote_history_contamination_is_detected_without_rewrite(self):
        with tempfile.TemporaryDirectory() as tmp:
            base = Path(tmp)
            source = base / "source"
            remote = base / "remote.git"
            clone = base / "clone"
            source.mkdir()
            self.make_repo(source)
            (source / ".yaaw").mkdir()
            (source / ".yaaw/state.json").write_text("{}\n")
            self.git(source, "add", ".yaaw/state.json")
            self.git(source, "commit", "-m", "chore: accidental published metadata")
            self.git(source, "rm", ".yaaw/state.json")
            self.git(source, "commit", "-m", "chore: remove published metadata")
            subprocess.run(["git", "clone", "--bare", str(source), str(remote)], check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            subprocess.run(["git", "clone", str(remote), str(clone)], check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            self.git(clone, "config", "user.name", "YAAW Test")
            self.git(clone, "config", "user.email", "yaaw@example.test")
            self.install_core(clone)
            with self.assertRaisesRegex(InitializationError, guard.REMOTE_HISTORY_CONTAMINATION):
                initialize_project(clone)

    def test_outgoing_history_contamination_cannot_be_hidden_by_later_deletion(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            self.make_consumer(root)
            self.git(root, "add", "-f", ".yaaw/state.json")
            self.git(root, "commit", "--no-verify", "-m", "chore: accidental metadata")
            self.git(root, "rm", "--cached", ".yaaw/state.json")
            self.git(root, "commit", "--no-verify", "-m", "chore: remove metadata")
            sha = self.git(root, "rev-parse", "HEAD").stdout.strip()
            with self.assertRaisesRegex(guard.VcsGuardError, guard.LOCAL_HISTORY_CONTAMINATION):
                guard.pre_push(root, f"refs/heads/main {sha} refs/heads/main {guard.ZERO_SHA}\n")

    def test_invalid_vcs_config_fails_with_typed_policy_error(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            self.make_consumer(root)
            config = json.loads((root / ".yaaw/vcs.json").read_text())
            config["integration_branch"] = "staging"
            (root / ".yaaw/vcs.json").write_text(json.dumps(config, indent=2) + "\n")
            with self.assertRaisesRegex(guard.VcsGuardError, guard.VCS_POLICY_VIOLATION):
                guard.load_vcs_config(root)

    def test_non_git_consumer_fails_before_creating_artifacts(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            self.install_core(root)
            with self.assertRaisesRegex(InitializationError, "requires an initialized Git repository"):
                initialize_project(root)
            self.assertFalse((root / ".yaaw").exists())
            self.assertFalse((root / "docs").exists())

    def test_hook_health_detects_wrapper_tampering(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            self.make_consumer(root)
            common = guard.git_common_dir(root)
            wrapper = common / "hooks" / "pre-commit"
            wrapper.write_text(wrapper.read_text() + "\n# modified after install\n", encoding="utf-8")
            health = guard.hook_health(root)
            self.assertFalse(health["pre-commit"])
            with self.assertRaisesRegex(guard.VcsGuardError, guard.PUBLICATION_NOT_ALLOWED):
                guard.publication_audit(root, "main")

    def test_publication_audit_rejects_dirty_publishable_worktree(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            self.make_consumer(root)
            (root / "app.txt").write_text("uncommitted publishable change\n", encoding="utf-8")
            with self.assertRaisesRegex(guard.VcsGuardError, "worktree must be clean"):
                guard.publication_audit(root, "main")

    def test_framework_repository_is_not_consumer_classified_without_marker(self):
        self.assertFalse(guard.consumer_mode_active(ROOT))
        self.assertEqual(guard.classify_path(ROOT, ".yaaw-core/vcs/guard.py"), "framework")

    def test_framework_mode_uses_tracked_yaaw_source_not_remote_repository_name(self):
        from scripts import init_project
        self.assertTrue(init_project._framework_mode(ROOT))


if __name__ == "__main__":
    unittest.main()
