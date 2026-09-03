#!/usr/bin/env python3
"""Fail closed when committed or local changes escape declared task scope."""
from __future__ import annotations

import argparse
import re
import subprocess
from pathlib import PurePosixPath


def _glob_regex(pattern: str) -> re.Pattern[str]:
    i = 0
    out = "^"
    while i < len(pattern):
        c = pattern[i]
        if c == "*":
            if i + 1 < len(pattern) and pattern[i + 1] == "*":
                i += 1
                if i + 1 < len(pattern) and pattern[i + 1] == "/":
                    i += 1
                    out += "(?:.*/)?"
                else:
                    out += ".*"
            else:
                out += "[^/]*"
        elif c == "?":
            out += "[^/]"
        else:
            out += re.escape(c)
        i += 1
    return re.compile(out + "$")


def matches(path: str, patterns: list[str]) -> bool:
    normalized = PurePosixPath(path).as_posix().lstrip("./")
    return any(_glob_regex(pattern.lstrip("./")).match(normalized) for pattern in patterns)


def _run(args: list[str]) -> list[str]:
    result = subprocess.run(args, text=True, capture_output=True, check=True)
    return [line.strip() for line in result.stdout.splitlines() if line.strip()]


def changed_paths_range(base: str, head: str) -> list[str]:
    return sorted(set(_run(["git", "diff", "--name-only", "--find-renames", f"{base}...{head}"])))


def changed_paths_local() -> list[str]:
    paths: set[str] = set()
    paths.update(_run(["git", "diff", "--name-only", "--find-renames", "HEAD"]))
    paths.update(_run(["git", "diff", "--cached", "--name-only", "--find-renames", "HEAD"]))
    paths.update(_run(["git", "ls-files", "--others", "--exclude-standard"]))
    return sorted(paths)


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
    assert not matches("src/auth/deep/login.py", ["src/auth/*"])
    assert matches("src/auth/deep/login.py", ["src/auth/**"])
    print("OK: scope verifier self-test passed")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--mode", choices=["all-local", "range"], default="all-local")
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

    paths = changed_paths_local() if args.mode == "all-local" else changed_paths_range(args.base, args.head)
    violations = verify(paths, args.allowed, args.forbidden)
    if violations:
        print("Scope verification failed:")
        for item in violations:
            print(f"  - {item}")
        raise SystemExit(2)
    print(f"OK: {len(paths)} changed path(s) remain inside declared scope ({args.mode})")


if __name__ == "__main__":
    main()
