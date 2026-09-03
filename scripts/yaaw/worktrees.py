"""Isolated Git worktree allocation primitives for parallel mutating agents."""
from __future__ import annotations

import re
import subprocess
from pathlib import Path


class WorktreeError(RuntimeError):
    pass


_SAFE = re.compile(r"^[A-Za-z0-9._/-]+$")


def _check_branch(branch: str) -> None:
    if not _SAFE.fullmatch(branch) or branch.startswith("-") or ".." in branch:
        raise WorktreeError(f"unsafe branch name: {branch!r}")


def allocate(repo: Path, destination: Path, branch: str, base: str = "HEAD") -> None:
    _check_branch(branch)
    if destination.exists():
        raise WorktreeError(f"destination already exists: {destination}")
    subprocess.run(["git", "-C", str(repo), "worktree", "add", "-b", branch, str(destination), base], check=True)


def remove(repo: Path, destination: Path, force: bool = False) -> None:
    cmd = ["git", "-C", str(repo), "worktree", "remove"]
    if force:
        cmd.append("--force")
    cmd.append(str(destination))
    subprocess.run(cmd, check=True)
