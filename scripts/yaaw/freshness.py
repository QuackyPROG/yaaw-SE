"""Source fingerprints for stale-contract detection."""
from __future__ import annotations

import hashlib
import subprocess
from pathlib import Path


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as fh:
        for chunk in iter(lambda: fh.read(1024 * 1024), b""):
            digest.update(chunk)
    return "sha256:" + digest.hexdigest()


def git_head(repo: Path = Path(".")) -> str:
    result = subprocess.run(["git", "-C", str(repo), "rev-parse", "HEAD"], text=True, capture_output=True, check=True)
    return "git:" + result.stdout.strip()


def fingerprint(path: Path, repo: Path = Path(".")) -> str:
    if path == Path("."):
        return git_head(repo)
    return sha256_file(repo / path)


def stale(expected: dict[str, str], repo: Path = Path(".")) -> dict[str, tuple[str, str]]:
    mismatches: dict[str, tuple[str, str]] = {}
    for source, old in expected.items():
        try:
            current = fingerprint(Path(source), repo)
        except (FileNotFoundError, subprocess.CalledProcessError):
            current = "MISSING"
        if current != old:
            mismatches[source] = (old, current)
    return mismatches
