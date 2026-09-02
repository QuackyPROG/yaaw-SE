#!/usr/bin/env python3
"""Fail closed when changed paths escape a bounded task's allowed/forbidden globs."""
from __future__ import annotations

import argparse
import fnmatch
import subprocess
from pathlib import PurePosixPath


def matches(path: str, patterns: list[str]) -> bool:
    normalized = PurePosixPath(path).as_posix()
    return any(fnmatch.fnmatchcase(normalized, pattern) for pattern in patterns)


def changed_paths(base: str, head: str) -> list[str]:
    result = subprocess.run(
        ["git", "diff", "--name-only", f"{base}...{head}"],
        text=True,
        capture_output=True,
        check=True,
    )
    return [line.strip() for line in result.stdout.splitlines() if line.strip()]


def verify(paths: list[str], allowed: list[str], forbidden: list[str]) -> list[str]:
    violations = []
    for path in paths:
        if forbidden and matches(path, forbidden):
            violations.append(f"FORBIDDEN {path}")
            continue
        if not matches(path, allowed):
            violations.append(f"OUTSIDE_ALLOWED {path}")
    return violations


def self_test() -> None:
    allowed = ["src/auth/**", "tests/auth/**"]
    forbidden = ["src/auth/secrets/**"]
    assert verify(["src/auth/login.py", "tests/auth/test_login.py"], allowed, forbidden) == []
    assert verify(["src/payments/x.py"], allowed, forbidden) == ["OUTSIDE_ALLOWED src/payments/x.py"]
    assert verify(["src/auth/secrets/key.py"], allowed, forbidden) == ["FORBIDDEN src/auth/secrets/key.py"]
    print("OK: scope verifier self-test passed")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base", default="HEAD~1")
    parser.add_argument("--head", default="HEAD")
    parser.add_argument("--allowed", action="append", default=[])
    parser.add_argument("--forbidden", action="append", default=[])
    parser.add_argument("--self-test", action="store_true")
    args = parser.parse_args()

    if args.self_test:
        self_test()
        return
    if not args.allowed:
        raise SystemExit("ERROR: at least one --allowed glob is required")

    paths = changed_paths(args.base, args.head)
    violations = verify(paths, args.allowed, args.forbidden)
    if violations:
        print("Scope verification failed:")
        for item in violations:
            print(f"  - {item}")
        raise SystemExit(2)
    print(f"OK: {len(paths)} changed path(s) remain inside declared scope")


if __name__ == "__main__":
    main()
