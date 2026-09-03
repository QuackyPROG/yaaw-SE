"""Deterministic ownership resolution with explicit ambiguity detection."""
from __future__ import annotations

import re
from dataclasses import dataclass
from pathlib import PurePosixPath
from typing import Iterable


class OwnershipError(ValueError):
    pass


@dataclass(frozen=True)
class OwnershipRule:
    pattern: str
    owner: str
    co_owners: tuple[str, ...] = ()
    deny: bool = False
    source: str = "core"

    @property
    def specificity(self) -> tuple[int, int, int]:
        segments = [s for s in self.pattern.split("/") if s]
        literal = sum(1 for s in segments if "*" not in s and "?" not in s and "[" not in s)
        wildcards = sum(s.count("*") + s.count("?") for s in segments)
        return (literal, -wildcards, len(self.pattern))


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
    out += "$"
    return re.compile(out)


def matches(path: str, pattern: str) -> bool:
    normalized = PurePosixPath(path).as_posix().lstrip("./")
    return bool(_glob_regex(pattern.lstrip("./")).match(normalized))


def resolve(path: str, rules: Iterable[OwnershipRule], default_owner: str = "UNKNOWN_OWNER") -> OwnershipRule:
    candidates = [rule for rule in rules if matches(path, rule.pattern)]
    if not candidates:
        return OwnershipRule("<default>", default_owner, source="default")
    candidates.sort(key=lambda r: r.specificity, reverse=True)
    best = candidates[0]
    equal = [r for r in candidates if r.specificity == best.specificity]
    identities = {(r.owner, r.co_owners, r.deny) for r in equal}
    if len(identities) > 1:
        detail = ", ".join(f"{r.pattern}->{r.owner}" for r in equal)
        raise OwnershipError(f"ambiguous ownership for {path}: {detail}")
    if any(r.deny for r in equal):
        return next(r for r in equal if r.deny)
    return best


def validate_rules(rules: Iterable[OwnershipRule]) -> list[str]:
    errors: list[str] = []
    seen: dict[str, OwnershipRule] = {}
    for rule in rules:
        prior = seen.get(rule.pattern)
        if prior and (prior.owner, prior.co_owners, prior.deny) != (rule.owner, rule.co_owners, rule.deny):
            errors.append(f"conflicting exact ownership pattern {rule.pattern}: {prior.owner} vs {rule.owner}")
        else:
            seen[rule.pattern] = rule
    return sorted(set(errors))
