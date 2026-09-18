#!/usr/bin/env python3
"""Deterministic consumer VCS isolation for YAAW.

This module is an operational guard, not a semantic agent.  In consumer mode it
classifies publication paths from canonical registries + the local installation
manifest, installs local-only Git protections, validates exact-path checkpoint
commits, computes publishable repository identity, and audits outgoing history.
"""
from __future__ import annotations

import argparse
import fnmatch
import hashlib
import json
import os
import re
import shlex
import shutil
import stat
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, Sequence

CONSUMER_MARKER = Path(".yaaw/install.json")
VCS_CONFIG = Path(".yaaw/vcs.json")
MANAGED_EXCLUDE_START = "# >>> YAAW consumer local-only >>>"
MANAGED_EXCLUDE_END = "# <<< YAAW consumer local-only <<<"
HOOK_MARKER = "# YAAW_MANAGED_HOOK_V1"
ZERO_SHA = "0" * 40

VCS_POLICY_VIOLATION = "VCS_POLICY_VIOLATION"
PATH_OWNERSHIP_CONFLICT = "PATH_OWNERSHIP_CONFLICT"
TRACKED_YAAW_ARTIFACT = "TRACKED_YAAW_ARTIFACT"
LOCAL_HISTORY_CONTAMINATION = "LOCAL_HISTORY_CONTAMINATION"
REMOTE_HISTORY_CONTAMINATION = "REMOTE_HISTORY_CONTAMINATION"
REMOTE_POLICY_CONFLICT = "REMOTE_POLICY_CONFLICT"
HOOK_INSTALL_CONFLICT = "HOOK_INSTALL_CONFLICT"
PUBLICATION_NOT_ALLOWED = "PUBLICATION_NOT_ALLOWED"


class VcsGuardError(RuntimeError):
    def __init__(self, code: str, message: str, details: Sequence[str] | None = None):
        self.code = code
        self.details = list(details or [])
        suffix = ""
        if self.details:
            suffix = "\n" + "\n".join(f"- {item}" for item in self.details)
        super().__init__(f"{code}: {message}{suffix}")


@dataclass(frozen=True)
class RepositoryIdentity:
    identity_schema: str
    head_commit: str
    branch: str
    dirty_publishable: bool
    publishable_worktree_digest: str

    def as_dict(self) -> dict[str, object]:
        return {
            "identity_schema": self.identity_schema,
            "head_commit": self.head_commit,
            "branch": self.branch,
            "dirty_publishable": self.dirty_publishable,
            "publishable_worktree_digest": self.publishable_worktree_digest,
        }


def _run(
    repo: Path,
    *args: str,
    input_text: str | None = None,
    check: bool = True,
) -> subprocess.CompletedProcess[str]:
    proc = subprocess.run(
        ["git", "-C", str(repo), *args],
        input=input_text,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        check=False,
    )
    if check and proc.returncode != 0:
        raise VcsGuardError(
            VCS_POLICY_VIOLATION,
            f"git {' '.join(args)} failed",
            [proc.stderr.strip() or proc.stdout.strip() or f"exit {proc.returncode}"],
        )
    return proc


def git_output(repo: Path, *args: str, check: bool = True) -> str:
    return _run(repo, *args, check=check).stdout.strip()


def is_git_repository(repo: Path) -> bool:
    return _run(repo, "rev-parse", "--git-dir", check=False).returncode == 0


def git_common_dir(repo: Path) -> Path:
    raw = git_output(repo, "rev-parse", "--git-common-dir")
    path = Path(raw)
    if not path.is_absolute():
        path = (repo / path).resolve()
    return path


def repo_root(repo: Path) -> Path:
    return Path(git_output(repo, "rev-parse", "--show-toplevel")).resolve()


def _load_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def _common_snapshot(repo: Path, name: str) -> Path | None:
    if not is_git_repository(repo):
        return None
    return git_common_dir(repo) / "yaaw" / name


def consumer_manifest(repo: Path) -> dict:
    candidates = [repo / CONSUMER_MARKER]
    snapshot = _common_snapshot(repo, "install.json")
    if snapshot is not None:
        candidates.append(snapshot)
    for path in candidates:
        if not path.is_file():
            continue
        try:
            return _load_json(path)
        except (OSError, json.JSONDecodeError) as exc:
            raise VcsGuardError(VCS_POLICY_VIOLATION, f"invalid consumer marker {path}", [str(exc)]) from exc
    return {}


def consumer_mode_active(repo: Path) -> bool:
    manifest = consumer_manifest(repo)
    return manifest.get("mode") == "consumer" and manifest.get("vcs_isolation") == "enabled"


def require_consumer_mode(repo: Path) -> dict:
    manifest = consumer_manifest(repo)
    if manifest.get("mode") != "consumer" or manifest.get("vcs_isolation") != "enabled":
        raise VcsGuardError(
            VCS_POLICY_VIOLATION,
            "consumer VCS policy is not active; refusing consumer-only Git operation",
        )
    return manifest


def _registry_root(repo: Path) -> Path:
    return repo / ".yaaw-core" / "registries"


def _load_repo_or_snapshot(repo: Path, primary: Path, snapshot_name: str, label: str) -> dict:
    candidates = [primary]
    snapshot = _common_snapshot(repo, snapshot_name)
    if snapshot is not None:
        candidates.append(snapshot)
    for path in candidates:
        if path.is_file():
            return _load_json(path)
    raise VcsGuardError(VCS_POLICY_VIOLATION, f"missing {label}", [str(p) for p in candidates])


def load_policy(repo: Path) -> dict:
    return _load_repo_or_snapshot(
        repo,
        _registry_root(repo) / "vcs-policy.json",
        "vcs-policy.json",
        "canonical VCS policy registry",
    )


def load_artifacts(repo: Path) -> dict:
    data = _load_repo_or_snapshot(
        repo,
        _registry_root(repo) / "artifacts.json",
        "artifacts.json",
        "canonical artifact registry",
    )
    return data.get("artifacts", {})


def load_vcs_config(repo: Path) -> dict:
    config = _load_repo_or_snapshot(repo, repo / VCS_CONFIG, "vcs.json", "local VCS configuration")
    if config.get("schema") != "yaaw.vcs/v1" or config.get("mode") != "consumer":
        raise VcsGuardError(VCS_POLICY_VIOLATION, "invalid local VCS configuration", [str(path)])
    return config


def normalize_path(repo: Path, value: str | Path) -> str:
    text = str(value).replace("\\", "/")
    path = Path(text)
    if path.is_absolute():
        try:
            text = path.resolve().relative_to(repo.resolve()).as_posix()
        except ValueError as exc:
            raise VcsGuardError(VCS_POLICY_VIOLATION, "path is outside repository", [str(path)]) from exc
    while text.startswith("./"):
        text = text[2:]
    if text in {"", "."}:
        return "."
    if text.startswith("../") or "/../" in f"/{text}/":
        raise VcsGuardError(VCS_POLICY_VIOLATION, "path escapes repository", [text])
    return text.rstrip("/")


def _artifact_glob(pattern: str) -> str | None:
    if pattern.startswith("<"):
        return None
    return re.sub(r"<[^>]+>", "*", pattern)


def _matches(path: str, pattern: str) -> bool:
    # pathlib/fnmatch do not give Git-style ** semantics consistently; normalize
    # directory-wide patterns explicitly and then fall back to fnmatch.
    pattern = pattern.replace("\\", "/")
    if pattern.endswith("/**"):
        prefix = pattern[:-3].rstrip("/")
        return path == prefix or path.startswith(prefix + "/")
    return fnmatch.fnmatchcase(path, pattern)


def classify_path(repo: Path, value: str | Path) -> str:
    """Return framework, local_only, publishable, conflict, or git_internal."""
    repo = repo.resolve()
    path = normalize_path(repo, value)
    if path == ".git" or path.startswith(".git/"):
        return "git_internal"
    if not consumer_mode_active(repo):
        return "framework"

    manifest = consumer_manifest(repo)
    policy = load_policy(repo)
    artifacts = load_artifacts(repo)

    for pattern in policy.get("control_plane", {}).get("always_local_patterns", []):
        if _matches(path, pattern):
            return "local_only"

    for pattern in manifest.get("owned_paths", []):
        if _matches(path, pattern):
            return "local_only"

    ownership = manifest.get("artifact_ownership", {})
    for artifact_id, entry in artifacts.items():
        glob = _artifact_glob(entry.get("pattern", ""))
        if not glob or not _matches(path, glob):
            continue
        visibility = entry.get("vcs_visibility")
        if visibility == "publishable":
            return "publishable"
        if visibility != "local_only":
            continue
        if glob.startswith(".yaaw/"):
            return "local_only"
        owner = ownership.get(artifact_id)
        if owner == "yaaw":
            return "local_only"
        if owner == "conflict":
            return "conflict"
        # Explicit application ownership wins for shared paths.
        if owner == "application":
            return "publishable"

    return "publishable"


def protected_path(repo: Path, value: str | Path) -> bool:
    return classify_path(repo, value) == "local_only"


def validate_message(repo: Path, message: str) -> None:
    for pattern in load_policy(repo).get("commit_messages", {}).get("internal_patterns", []):
        if re.search(pattern, message):
            raise VcsGuardError(
                VCS_POLICY_VIOLATION,
                "commit message leaks YAAW workflow identity",
                [pattern, message.strip().splitlines()[0] if message.strip() else "<empty>"],
            )


def staged_paths(repo: Path) -> list[str]:
    raw = _run(repo, "diff", "--cached", "--name-only", "-z").stdout
    return sorted({item for item in raw.split("\0") if item})


def untracked_paths(repo: Path) -> list[str]:
    raw = _run(repo, "ls-files", "--others", "--exclude-standard", "-z").stdout
    return sorted({item for item in raw.split("\0") if item})


def changed_paths_against_head(repo: Path) -> list[str]:
    raw = _run(repo, "diff", "--name-only", "-z", "HEAD").stdout
    return sorted({item for item in raw.split("\0") if item})


def publishable_identity(repo: Path) -> RepositoryIdentity:
    repo = repo_root(repo)
    head = git_output(repo, "rev-parse", "HEAD")
    branch = git_output(repo, "branch", "--show-current") or "DETACHED"
    changed = [p for p in changed_paths_against_head(repo) if classify_path(repo, p) == "publishable"]
    untracked = [p for p in untracked_paths(repo) if classify_path(repo, p) == "publishable"]

    digest = hashlib.sha256()
    for path in changed:
        proc = _run(repo, "diff", "--binary", "HEAD", "--", path)
        digest.update(b"diff\0")
        digest.update(path.encode())
        digest.update(b"\0")
        digest.update(proc.stdout.encode())
    for path in untracked:
        full = repo / path
        digest.update(b"untracked\0")
        digest.update(path.encode())
        digest.update(b"\0")
        if full.is_file():
            digest.update(hashlib.sha256(full.read_bytes()).digest())
        else:
            digest.update(b"<non-file>")

    return RepositoryIdentity(
        identity_schema="yaaw.repository-identity/v2",
        head_commit=head,
        branch=branch,
        dirty_publishable=bool(changed or untracked),
        publishable_worktree_digest="sha256:" + digest.hexdigest(),
    )


def _owned_exclude_patterns(repo: Path) -> list[str]:
    manifest = consumer_manifest(repo)
    policy = load_policy(repo)
    patterns = list(policy.get("control_plane", {}).get("always_local_patterns", []))
    patterns.extend(manifest.get("owned_paths", []))
    artifacts = load_artifacts(repo)
    ownership = manifest.get("artifact_ownership", {})
    for artifact_id, owner in ownership.items():
        if owner != "yaaw":
            continue
        entry = artifacts.get(artifact_id, {})
        glob = _artifact_glob(entry.get("pattern", ""))
        if glob and not glob.startswith(".yaaw/"):
            patterns.append(glob)
    # Git exclude accepts directory patterns without ** more readably.
    normalized: list[str] = []
    for pattern in patterns:
        if pattern == ".yaaw/**":
            pattern = ".yaaw/"
        elif pattern == ".yaaw-core/**":
            pattern = ".yaaw-core/"
        normalized.append(pattern)
    return sorted(dict.fromkeys(normalized))


def install_exclude(repo: Path) -> Path:
    common = git_common_dir(repo)
    path = common / "info" / "exclude"
    path.parent.mkdir(parents=True, exist_ok=True)
    old = path.read_text(encoding="utf-8") if path.exists() else ""
    block = MANAGED_EXCLUDE_START + "\n" + "\n".join(_owned_exclude_patterns(repo)) + "\n" + MANAGED_EXCLUDE_END
    pattern = re.compile(
        re.escape(MANAGED_EXCLUDE_START) + r".*?" + re.escape(MANAGED_EXCLUDE_END),
        flags=re.DOTALL,
    )
    if pattern.search(old):
        new = pattern.sub(block, old)
    else:
        spacer = "" if not old or old.endswith("\n") else "\n"
        new = old + spacer + block + "\n"
    if new != old:
        path.write_text(new, encoding="utf-8")
    return path


def _inside(child: Path, parent: Path) -> bool:
    try:
        child.resolve().relative_to(parent.resolve())
        return True
    except ValueError:
        return False


def _hook_wrapper(hook: str, guard_path: Path, original: Path | None) -> str:
    guard_q = shlex.quote(str(guard_path))
    orig_q = shlex.quote(str(original)) if original else ""
    if hook == "pre-push":
        original_block = ""
        if original:
            original_block = f"""
if [ -x {orig_q} ]; then
  {orig_q} "$@" < "$tmp" || {{ rc=$?; rm -f "$tmp"; exit "$rc"; }}
fi
"""
        return f"""#!/bin/sh
{HOOK_MARKER}
set -eu
repo="$(git rev-parse --show-toplevel)"
tmp="$(mktemp)"
trap 'rm -f "$tmp"' EXIT HUP INT TERM
cat > "$tmp"
{original_block}python3 {guard_q} hook pre-push --repo "$repo" -- "$@" < "$tmp"
"""
    original_block = ""
    if original:
        original_block = f"""
if [ -x {orig_q} ]; then
  {orig_q} "$@"
fi
"""
    return f"""#!/bin/sh
{HOOK_MARKER}
set -eu
repo="$(git rev-parse --show-toplevel)"
{original_block}python3 {guard_q} hook {hook} --repo "$repo" -- "$@"
"""


def install_hooks(repo: Path, source_guard: Path) -> dict:
    common = git_common_dir(repo)
    configured = git_output(repo, "config", "--local", "--get", "core.hooksPath", check=False)
    if configured:
        raise VcsGuardError(
            HOOK_INSTALL_CONFLICT,
            "existing core.hooksPath is intentionally not overwritten",
            [configured],
        )

    yaaw_dir = common / "yaaw"
    yaaw_dir.mkdir(parents=True, exist_ok=True)
    deployed = yaaw_dir / "guard.py"
    source_bytes = source_guard.read_bytes()
    if not deployed.exists() or deployed.read_bytes() != source_bytes:
        deployed.write_bytes(source_bytes)
        deployed.chmod(deployed.stat().st_mode | stat.S_IXUSR)

    hooks_dir = common / "hooks"
    hooks_dir.mkdir(parents=True, exist_ok=True)
    hook_state: dict[str, object] = {"hooks": {}, "guard_sha256": hashlib.sha256(source_bytes).hexdigest()}
    for hook in ("pre-commit", "commit-msg", "pre-push"):
        target = hooks_dir / hook
        backup = hooks_dir / f"{hook}.yaaw-original"
        original: Path | None = None
        if target.exists():
            text = target.read_text(encoding="utf-8", errors="replace")
            if HOOK_MARKER not in text:
                if backup.exists():
                    raise VcsGuardError(
                        HOOK_INSTALL_CONFLICT,
                        f"cannot preserve existing {hook}; YAAW backup already exists",
                        [str(target), str(backup)],
                    )
                target.replace(backup)
                original = backup
            elif backup.exists():
                original = backup
        elif backup.exists():
            original = backup

        wrapper = _hook_wrapper(hook, deployed, original)
        target.write_text(wrapper, encoding="utf-8")
        target.chmod(target.stat().st_mode | stat.S_IXUSR)
        hook_state["hooks"][hook] = {
            "wrapper": str(target),
            "original": str(original) if original else None,
        }

    state_path = yaaw_dir / "hook-state.json"
    state_path.write_text(json.dumps(hook_state, indent=2) + "\n", encoding="utf-8")
    return hook_state


def hook_health(repo: Path) -> dict[str, bool]:
    common = git_common_dir(repo)
    deployed = common / "yaaw" / "guard.py"
    result = {"guard": deployed.is_file()}
    for hook in ("pre-commit", "commit-msg", "pre-push"):
        path = common / "hooks" / hook
        result[hook] = path.is_file() and HOOK_MARKER in path.read_text(encoding="utf-8", errors="replace")
    return result


def _history_paths(repo: Path, refs: Iterable[str]) -> list[str]:
    contaminated: set[str] = set()
    for ref in refs:
        proc = _run(repo, "log", "--format=", "--name-only", "-z", ref, check=False)
        if proc.returncode != 0:
            continue
        for path in proc.stdout.split("\0"):
            path = path.strip()
            if path and classify_path(repo, path) == "local_only":
                contaminated.add(path)
    return sorted(contaminated)


def contamination_audit(repo: Path) -> dict[str, list[str]]:
    require_consumer_mode(repo)
    tracked_raw = _run(repo, "ls-files", "-z").stdout
    tracked = sorted({p for p in tracked_raw.split("\0") if p and protected_path(repo, p)})

    remote_refs = [
        line for line in git_output(repo, "for-each-ref", "--format=%(refname)", "refs/remotes", check=False).splitlines()
        if line and not line.endswith("/HEAD")
    ]
    local_refs = [
        line for line in git_output(repo, "for-each-ref", "--format=%(refname)", "refs/heads", check=False).splitlines()
        if line
    ]
    remote_history = _history_paths(repo, remote_refs)
    local_history = [] if remote_history else _history_paths(repo, local_refs)

    return {
        "tracked": tracked,
        "local_history": local_history,
        "remote_history": remote_history,
    }


def assert_clean_consumer_history(repo: Path) -> None:
    audit = contamination_audit(repo)
    if audit["tracked"]:
        raise VcsGuardError(TRACKED_YAAW_ARTIFACT, "protected YAAW paths are tracked", audit["tracked"])
    if audit["remote_history"]:
        raise VcsGuardError(
            REMOTE_HISTORY_CONTAMINATION,
            "protected YAAW paths already exist in remote history; automatic rewriting is forbidden",
            audit["remote_history"],
        )
    if audit["local_history"]:
        raise VcsGuardError(
            LOCAL_HISTORY_CONTAMINATION,
            "protected YAAW paths exist in local history; deliberate cleanup is required",
            audit["local_history"],
        )


def bootstrap_consumer(repo: Path, source_guard: Path) -> dict:
    repo = repo_root(repo)
    manifest = require_consumer_mode(repo)
    before_gitignore = (repo / ".gitignore").read_bytes() if (repo / ".gitignore").exists() else None
    common = git_common_dir(repo)
    metadata = common / "yaaw"
    metadata.mkdir(parents=True, exist_ok=True)

    # Worktrees share the Git common directory but not untracked YAAW files.
    # Snapshot only machine policy/config needed by deployed guards so every
    # linked worktree receives the same protection without publishing YAAW.
    snapshots = {
        "install.json": manifest,
        "vcs.json": _load_json(repo / VCS_CONFIG),
        "vcs-policy.json": _load_json(_registry_root(repo) / "vcs-policy.json"),
        "artifacts.json": _load_json(_registry_root(repo) / "artifacts.json"),
    }
    for name, value in snapshots.items():
        (metadata / name).write_text(json.dumps(value, indent=2) + "\n", encoding="utf-8")

    exclude = install_exclude(repo)
    hooks = install_hooks(repo, source_guard)
    state_path = metadata / "config-state.json"
    prior_state = _load_json(state_path) if state_path.is_file() else {}
    previous_push_default = prior_state.get(
        "previous_push_default",
        git_output(repo, "config", "--local", "--get", "push.default", check=False) or None,
    )
    _run(repo, "config", "--local", "push.default", "nothing")
    config_state = {
        "schema": "yaaw.git-local-state/v1",
        "previous_push_default": previous_push_default,
        "effective_push_default": "nothing",
    }
    state_path.write_text(json.dumps(config_state, indent=2) + "\n", encoding="utf-8")
    after_gitignore = (repo / ".gitignore").read_bytes() if (repo / ".gitignore").exists() else None
    if before_gitignore != after_gitignore:
        raise AssertionError("YAAW bootstrap modified .gitignore")
    assert_clean_consumer_history(repo)
    return {"exclude": str(exclude), "hooks": hooks, "git_common_dir": str(common)}


def _upstream(repo: Path) -> str | None:
    proc = _run(repo, "rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{u}", check=False)
    return proc.stdout.strip() if proc.returncode == 0 and proc.stdout.strip() else None


def inspect_repository(repo: Path) -> dict:
    require_consumer_mode(repo)
    identity = publishable_identity(repo)
    config = load_vcs_config(repo)
    branch = identity.branch
    allowed = set(config.get("publish_branches", []))
    pending = sorted(
        p.relative_to(repo).as_posix()
        for p in (repo / ".yaaw" / "vcs" / "checkpoints").glob("**/*.json")
    ) if (repo / ".yaaw" / "vcs" / "checkpoints").exists() else []
    staged_protected = [p for p in staged_paths(repo) if protected_path(repo, p)]
    upstream = _upstream(repo)
    upstream_violation = bool(upstream and branch not in allowed)
    return {
        "schema": "yaaw.vcs-observed/v1",
        "consumer_vcs_policy_active": True,
        "current_branch": branch,
        "integration_branch": config.get("integration_branch", "main"),
        "publish_branches": sorted(allowed),
        "publishable_dirty": identity.dirty_publishable,
        "publishable_worktree_digest": identity.publishable_worktree_digest,
        "head_commit": identity.head_commit,
        "protected_path_staged": staged_protected,
        "local_branch_has_upstream": upstream is not None,
        "upstream": upstream,
        "upstream_policy_violation": upstream_violation,
        "pending_checkpoints": pending,
        "hook_health": hook_health(repo),
        "contamination": contamination_audit(repo),
    }


def _assert_allowed_branch_pair(repo: Path, local_ref: str, remote_ref: str) -> str:
    config = load_vcs_config(repo)
    allowed = set(config.get("publish_branches", []))
    if not local_ref.startswith("refs/heads/") or not remote_ref.startswith("refs/heads/"):
        raise VcsGuardError(PUBLICATION_NOT_ALLOWED, "only branch publication is supported")
    local = local_ref.removeprefix("refs/heads/")
    remote = remote_ref.removeprefix("refs/heads/")
    if local != remote or local not in allowed or remote not in allowed:
        raise VcsGuardError(
            PUBLICATION_NOT_ALLOWED,
            "source and destination must be the same allowlisted integration branch",
            [f"{local} -> {remote}", f"allowed={sorted(allowed)}"],
        )
    return local


def _commit_paths(repo: Path, commit: str) -> list[str]:
    raw = _run(repo, "diff-tree", "--root", "--no-commit-id", "--name-only", "-r", "-z", commit).stdout
    return sorted({p for p in raw.split("\0") if p})


def _outgoing_commits(repo: Path, local_sha: str, remote_sha: str) -> list[str]:
    if remote_sha and remote_sha != ZERO_SHA:
        if _run(repo, "merge-base", "--is-ancestor", remote_sha, local_sha, check=False).returncode != 0:
            raise VcsGuardError(PUBLICATION_NOT_ALLOWED, "non-fast-forward publication is forbidden")
        spec = f"{remote_sha}..{local_sha}"
        out = git_output(repo, "rev-list", "--reverse", spec)
    else:
        out = git_output(repo, "rev-list", "--reverse", local_sha)
    return [line for line in out.splitlines() if line]


def validate_outgoing_history(repo: Path, commits: Sequence[str]) -> None:
    contaminated: list[str] = []
    bad_messages: list[str] = []
    for commit in commits:
        for path in _commit_paths(repo, commit):
            if protected_path(repo, path):
                contaminated.append(f"{commit[:12]} {path}")
        message = git_output(repo, "show", "-s", "--format=%B", commit)
        try:
            validate_message(repo, message)
        except VcsGuardError:
            subject = message.strip().splitlines()[0] if message.strip() else "<empty>"
            bad_messages.append(f"{commit[:12]} {subject}")
    if contaminated:
        raise VcsGuardError(PUBLICATION_NOT_ALLOWED, "outgoing history contains protected YAAW paths", contaminated)
    if bad_messages:
        raise VcsGuardError(PUBLICATION_NOT_ALLOWED, "outgoing history contains YAAW-internal commit messages", bad_messages)


def pre_commit(repo: Path) -> None:
    require_consumer_mode(repo)
    bad = [p for p in staged_paths(repo) if protected_path(repo, p)]
    conflicts = [p for p in staged_paths(repo) if classify_path(repo, p) == "conflict"]
    if bad or conflicts:
        raise VcsGuardError(
            VCS_POLICY_VIOLATION,
            "protected or ownership-conflicted path is staged",
            sorted(set(bad + conflicts)),
        )


def commit_msg(repo: Path, message_file: Path) -> None:
    require_consumer_mode(repo)
    validate_message(repo, message_file.read_text(encoding="utf-8"))


def pre_push(repo: Path, stdin: str) -> None:
    require_consumer_mode(repo)
    assert_clean_consumer_history(repo)
    current_branch = git_output(repo, "branch", "--show-current")
    config = load_vcs_config(repo)
    if _upstream(repo) and current_branch not in set(config.get("publish_branches", [])):
        raise VcsGuardError(PUBLICATION_NOT_ALLOWED, "local topic/worktree branch has a remote upstream", [current_branch])

    lines = [line.strip() for line in stdin.splitlines() if line.strip()]
    if not lines:
        return
    for line in lines:
        parts = line.split()
        if len(parts) != 4:
            raise VcsGuardError(VCS_POLICY_VIOLATION, "unexpected pre-push input", [line])
        local_ref, local_sha, remote_ref, remote_sha = parts
        if local_sha == ZERO_SHA:
            raise VcsGuardError(PUBLICATION_NOT_ALLOWED, "remote branch deletion is outside YAAW publication scope")
        _assert_allowed_branch_pair(repo, local_ref, remote_ref)
        commits = _outgoing_commits(repo, local_sha, remote_sha)
        validate_outgoing_history(repo, commits)


def create_checkpoint_commit(repo: Path, checkpoint_path: Path) -> str:
    require_consumer_mode(repo)
    checkpoint = _load_json(checkpoint_path)
    if checkpoint.get("schema") != "yaaw.commit-checkpoint/v1":
        raise VcsGuardError(VCS_POLICY_VIOLATION, "invalid checkpoint schema", [str(checkpoint_path)])
    base = checkpoint.get("base_commit")
    head = git_output(repo, "rev-parse", "HEAD")
    if base != head:
        raise VcsGuardError(VCS_POLICY_VIOLATION, "checkpoint base commit is stale", [f"expected {base}", f"actual {head}"])
    paths = [normalize_path(repo, p) for p in checkpoint.get("paths", [])]
    if not paths or len(paths) != len(set(paths)):
        raise VcsGuardError(VCS_POLICY_VIOLATION, "checkpoint paths must be non-empty and unique")
    bad = [p for p in paths if classify_path(repo, p) != "publishable"]
    if bad:
        raise VcsGuardError(VCS_POLICY_VIOLATION, "checkpoint contains non-publishable paths", bad)
    message = str(checkpoint.get("message", "")).strip()
    if not message:
        raise VcsGuardError(VCS_POLICY_VIOLATION, "checkpoint commit message is empty")
    validate_message(repo, message)

    existing = staged_paths(repo)
    if existing:
        raise VcsGuardError(VCS_POLICY_VIOLATION, "index must be empty before exact-path checkpoint staging", existing)

    _run(repo, "add", "--", *paths)
    actual = staged_paths(repo)
    if set(actual) != set(paths):
        # Fail closed and restore the candidate paths to unstaged state.
        _run(repo, "reset", "--", *paths, check=False)
        raise VcsGuardError(
            VCS_POLICY_VIOLATION,
            "exact staged set differs from checkpoint intent",
            [f"expected={sorted(paths)}", f"actual={actual}"],
        )
    pre_commit(repo)
    proc = _run(repo, "commit", "-m", message, check=False)
    if proc.returncode != 0:
        _run(repo, "reset", "--", *paths, check=False)
        raise VcsGuardError(VCS_POLICY_VIOLATION, "checkpoint commit failed", [proc.stderr.strip() or proc.stdout.strip()])
    return git_output(repo, "rev-parse", "HEAD")


def publication_audit(repo: Path, branch: str, remote_ref_sha: str | None = None) -> dict:
    require_consumer_mode(repo)
    config = load_vcs_config(repo)
    allowed = set(config.get("publish_branches", []))
    if branch not in allowed:
        raise VcsGuardError(PUBLICATION_NOT_ALLOWED, "branch is not allowlisted", [branch, f"allowed={sorted(allowed)}"])
    if git_output(repo, "branch", "--show-current") != branch:
        raise VcsGuardError(PUBLICATION_NOT_ALLOWED, "publication must originate from the checked-out integration branch")
    if any(not ok for ok in hook_health(repo).values()):
        raise VcsGuardError(PUBLICATION_NOT_ALLOWED, "local VCS guards are unhealthy")
    pre_commit(repo)
    assert_clean_consumer_history(repo)
    local_sha = git_output(repo, "rev-parse", branch)
    commits = _outgoing_commits(repo, local_sha, remote_ref_sha or ZERO_SHA)
    validate_outgoing_history(repo, commits)
    return {"branch": branch, "local_sha": local_sha, "outgoing_commits": commits}


def publish(repo: Path, remote: str, branch: str) -> None:
    remote_sha = git_output(repo, "rev-parse", f"refs/remotes/{remote}/{branch}", check=False) or ZERO_SHA
    publication_audit(repo, branch, remote_sha)
    proc = _run(repo, "push", remote, f"refs/heads/{branch}:refs/heads/{branch}", check=False)
    if proc.returncode != 0:
        message = proc.stderr.strip() or proc.stdout.strip()
        lowered = message.lower()
        code = REMOTE_POLICY_CONFLICT if ("protected branch" in lowered or "pull request" in lowered) else PUBLICATION_NOT_ALLOWED
        raise VcsGuardError(code, "explicit integration-branch push failed", [message])


def _hook_cli(args: argparse.Namespace, trailing: list[str]) -> None:
    repo = repo_root(args.repo)
    if args.hook_name == "pre-commit":
        pre_commit(repo)
    elif args.hook_name == "commit-msg":
        if not trailing:
            raise VcsGuardError(VCS_POLICY_VIOLATION, "commit-msg hook did not receive a message file")
        commit_msg(repo, Path(trailing[0]))
    elif args.hook_name == "pre-push":
        pre_push(repo, sys.stdin.read())
    else:
        raise VcsGuardError(VCS_POLICY_VIOLATION, "unknown hook", [args.hook_name])


def main(argv: Sequence[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="YAAW consumer VCS isolation guard")
    sub = parser.add_subparsers(dest="command", required=True)

    p = sub.add_parser("classify")
    p.add_argument("--repo", type=Path, default=Path("."))
    p.add_argument("paths", nargs="+")

    p = sub.add_parser("identity")
    p.add_argument("--repo", type=Path, default=Path("."))

    p = sub.add_parser("inspect")
    p.add_argument("--repo", type=Path, default=Path("."))

    p = sub.add_parser("audit")
    p.add_argument("--repo", type=Path, default=Path("."))

    p = sub.add_parser("bootstrap")
    p.add_argument("--repo", type=Path, default=Path("."))
    p.add_argument("--source-guard", type=Path, default=Path(__file__))

    p = sub.add_parser("checkpoint")
    p.add_argument("--repo", type=Path, default=Path("."))
    p.add_argument("checkpoint", type=Path)

    p = sub.add_parser("publish")
    p.add_argument("--repo", type=Path, default=Path("."))
    p.add_argument("--remote", default="origin")
    p.add_argument("--branch", required=True)

    p = sub.add_parser("hook")
    p.add_argument("hook_name", choices=["pre-commit", "commit-msg", "pre-push"])
    p.add_argument("--repo", type=Path, default=Path("."))

    args, trailing = parser.parse_known_args(argv)
    if trailing and trailing[0] == "--":
        trailing = trailing[1:]

    try:
        repo = repo_root(args.repo)
        if args.command == "classify":
            print(json.dumps({p: classify_path(repo, p) for p in args.paths}, indent=2))
        elif args.command == "identity":
            print(json.dumps(publishable_identity(repo).as_dict(), indent=2))
        elif args.command == "inspect":
            print(json.dumps(inspect_repository(repo), indent=2))
        elif args.command == "audit":
            print(json.dumps(contamination_audit(repo), indent=2))
        elif args.command == "bootstrap":
            print(json.dumps(bootstrap_consumer(repo, args.source_guard.resolve()), indent=2))
        elif args.command == "checkpoint":
            print(create_checkpoint_commit(repo, args.checkpoint))
        elif args.command == "publish":
            publish(repo, args.remote, args.branch)
        elif args.command == "hook":
            _hook_cli(args, trailing)
        return 0
    except VcsGuardError as exc:
        print(str(exc), file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
