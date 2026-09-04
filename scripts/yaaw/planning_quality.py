"""Conservative ticket-quality lint for non-observable acceptance and horizontal-slop plans."""
from __future__ import annotations

import re
from typing import Iterable

_GENERIC = {
    "works correctly",
    "make it work",
    "implement backend",
    "implement frontend",
    "implement database",
    "update code",
    "fix everything",
    "complete feature",
    "add tests",
}
_LAYER_ONLY = re.compile(r"^(implement|update|build|create)\s+(the\s+)?(backend|frontend|database|api|tests?|docs?)\.?$", re.I)
_OBSERVABLE_HINTS = (
    "when ", "then ", "returns", "rejects", "allows", "prevents", "records", "persists",
    "renders", "emits", "exposes", "preserves", "requires", "cannot", "must ", "without ",
    "stable", "measur", "detect", "validate", "pass", "fails", "blocks", "resolves",
)


def acceptance_issues(criteria: Iterable[str]) -> list[str]:
    items = [str(item).strip() for item in criteria if str(item).strip()]
    if not items:
        return ["acceptance is empty"]
    issues: list[str] = []
    for index, item in enumerate(items, 1):
        normalized = " ".join(item.lower().split()).rstrip(".")
        if normalized in _GENERIC or _LAYER_ONLY.match(item.strip()):
            issues.append(f"acceptance[{index}] is non-observable/horizontal: {item}")
            continue
        if len(normalized) < 16 and not any(hint in normalized for hint in _OBSERVABLE_HINTS):
            issues.append(f"acceptance[{index}] is too vague to verify: {item}")
    return issues


def plan_issues(metadata: dict) -> list[str]:
    issues = acceptance_issues(metadata.get("acceptance", []))
    allowed = [str(v).strip() for v in metadata.get("allowed_write", [])]
    expected = [str(v).strip() for v in metadata.get("expected_change_surface", [])]
    if metadata.get("kind") == "DELIVERY" and allowed and not expected:
        issues.append("DELIVERY declares write scope without expected_change_surface")
    if metadata.get("kind") == "DELIVERY" and expected and any(v in {"*", "**", "./**"} for v in expected):
        issues.append("DELIVERY expected_change_surface is unbounded")
    return issues
