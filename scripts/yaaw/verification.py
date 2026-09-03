"""Resolve project-defined verification commands and risk-specific checks."""
from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class VerificationCheck:
    id: str
    command: str
    paths: tuple[str, ...] = ()
    risks: tuple[str, ...] = ()
    required: bool = False


def select(checks: list[VerificationCheck], changed_paths: list[str], risks: list[str]) -> list[VerificationCheck]:
    from .ownership import matches

    selected = []
    risk_set = set(risks)
    for check in checks:
        path_match = not check.paths or any(any(matches(path, pattern) for pattern in check.paths) for path in changed_paths)
        risk_match = not check.risks or bool(risk_set.intersection(check.risks))
        if check.required or (path_match and risk_match):
            selected.append(check)
    dedup = {check.id: check for check in selected}
    return [dedup[key] for key in sorted(dedup)]
