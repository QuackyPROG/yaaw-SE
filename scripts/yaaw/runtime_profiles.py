"""Capability-based runtime/model selection without changing engineering semantics."""
from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path

REASONING_ORDER = {"low": 0, "medium": 1, "high": 2, "max": 3}


class RuntimeProfileError(RuntimeError):
    pass


@dataclass(frozen=True)
class RoleRequirement:
    min_reasoning: str
    capabilities: frozenset[str]
    model: str = "INHERIT"


@dataclass(frozen=True)
class ModelCandidate:
    model: str
    family: str
    reasoning: str
    capabilities: frozenset[str]


def load_requirement(path: Path, profile: str, role: str) -> RoleRequirement:
    data = json.loads(path.read_text(encoding="utf-8"))
    try:
        spec = data["profiles"][profile][role]
    except KeyError as exc:
        raise RuntimeProfileError(f"unknown model profile/role {profile}/{role}") from exc
    return RoleRequirement(spec["min_reasoning"], frozenset(spec.get("requires", [])), spec.get("model", "INHERIT"))


def satisfies(candidate: ModelCandidate, requirement: RoleRequirement) -> bool:
    try:
        reasoning_ok = REASONING_ORDER[candidate.reasoning] >= REASONING_ORDER[requirement.min_reasoning]
    except KeyError as exc:
        raise RuntimeProfileError(f"unknown reasoning level {exc.args[0]!r}") from exc
    return reasoning_ok and requirement.capabilities.issubset(candidate.capabilities)


def select_candidate(candidates: list[ModelCandidate], requirement: RoleRequirement, *, avoid_family: str | None = None, diversify_when_available: bool = False) -> ModelCandidate:
    eligible = [candidate for candidate in candidates if satisfies(candidate, requirement)]
    if requirement.model != "INHERIT":
        eligible = [candidate for candidate in eligible if candidate.model == requirement.model]
    if not eligible:
        raise RuntimeProfileError("no runtime model satisfies required capabilities/reasoning; downgrade is forbidden")
    if diversify_when_available and avoid_family:
        distinct = [candidate for candidate in eligible if candidate.family != avoid_family]
        if distinct:
            return distinct[0]
    return eligible[0]


def select_qa_candidate(candidates: list[ModelCandidate], requirement: RoleRequirement, implementer_family: str | None, diversification: str) -> ModelCandidate:
    if diversification not in {"OFF", "PREFER_DISTINCT_FAMILY", "REQUIRE_DISTINCT_FAMILY_WHEN_AVAILABLE"}:
        raise RuntimeProfileError(f"unknown QA diversification policy {diversification!r}")
    return select_candidate(
        candidates,
        requirement,
        avoid_family=implementer_family,
        diversify_when_available=diversification != "OFF",
    )
