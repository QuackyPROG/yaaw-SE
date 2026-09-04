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


def _run_text(args: list[str]) -> str:
    return subprocess.run(args, text=True, capture_output=True, check=True).stdout


def _parse_name_status_z(raw: str) -> list[str]:
    """Return every path endpoint from `git diff --name-status -z`.

    Renames/copies contribute both source and destination paths so moving a file
    from forbidden/out-of-scope territory into an allowed path cannot bypass scope.
    """
    tokens = raw.split("\0")
    if tokens and tokens[-1] == "":
        tokens.pop()
    paths: set[str] = set()
    i = 0
    while i < len(tokens):
        status = tokens[i]
        i += 1
        if not status:
            raise ValueError("empty git name-status record")
        code = status[0]
        required = 2 if code in {"R", "C"} else 1
        if i + required > len(tokens):
            raise ValueError(f"truncated git name-status record for {status!r}")
        if code in {"R", "C"}:
            paths.add(tokens[i])
            paths.add(tokens[i + 1])
            i += 2
        else:
            paths.add(tokens[i])
            i += 1
    return sorted(path for path in paths if path)


def _parse_paths_z(raw: str) -> list[str]:
    return sorted({path for path in raw.split("\0") if path})


def changed_paths_range(base: str, head: str) -> list[str]:
    raw = _run_text(["git", "diff", "--name-status", "-z", "--find-renames", f"{base}...{head}"])
    return _parse_name_status_z(raw)


def changed_paths_local() -> list[str]:
    paths: set[str] = set()
    paths.update(_parse_name_status_z(_run_text(["git", "diff", "--name-status", "-z", "--find-renames", "HEAD"])))
    paths.update(_parse_name_status_z(_run_text(["git", "diff", "--cached", "--name-status", "-z", "--find-renames", "HEAD"])))
    paths.update(_parse_paths_z(_run_text(["git", "ls-files", "-z", "--others", "--exclude-standard"])))
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

    rename = "R100\0src/payments/secret.py\0src/auth/secret.py\0"
    assert _parse_name_status_z(rename) == ["src/auth/secret.py", "src/payments/secret.py"]
    assert verify(_parse_name_status_z(rename), allowed, forbidden) == ["OUTSIDE_ALLOWED src/payments/secret.py"]
    copied = "C091\0src/auth/source.py\0tests/auth/copied.py\0D\0src/auth/old.py\0"
    assert _parse_name_status_z(copied) == ["src/auth/old.py", "src/auth/source.py", "tests/auth/copied.py"]
    try:
        _parse_name_status_z("R100\0only-one-path\0")
    except ValueError:
        pass
    else:
        raise AssertionError("truncated rename record must fail closed")
    print("OK: scope verifier self-test passed, including rename/copy endpoints")


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
    print(f"OK: {len(paths)} changed path endpoint(s) remain inside declared scope ({args.mode})")


if __name__ == "__main__":
    main()
