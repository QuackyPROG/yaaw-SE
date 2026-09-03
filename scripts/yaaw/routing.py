"""Separate planning complexity from consequence/risk floors."""
from __future__ import annotations

from dataclasses import dataclass
from enum import IntEnum


class Complexity(IntEnum):
    MICRO = 0
    BOUNDED = 1
    PLANNED_FEATURE = 2
    INITIATIVE = 3
    PROGRAM_ARCHITECTURE = 4


class Criticality(IntEnum):
    LOW = 0
    MODERATE = 1
    HIGH = 2
    CRITICAL = 3


@dataclass(frozen=True)
class RouteSignals:
    default_level: int
    uncertainty: int = 0
    subsystem_count: int = 1
    interface_change: bool = False
    architecture_scope: str = "NONE"
    migration_scope: str = "NONE"
    criticality: Criticality = Criticality.LOW
    security_trust_boundary: bool = False
    destructive: bool = False
    production_policy: bool = False


@dataclass(frozen=True)
class RouteDecision:
    level: int
    qa: str
    reasons: tuple[str, ...]


def decide(signals: RouteSignals) -> RouteDecision:
    level = max(0, min(4, signals.default_level))
    reasons: list[str] = [f"shape-default=L{level}"]
    if signals.uncertainty >= 2:
        level = max(level, 2)
        reasons.append("high uncertainty requires planning")
    if signals.subsystem_count > 1 or signals.interface_change:
        level = max(level, 2)
        reasons.append("multi-subsystem/interface coordination")
    if signals.architecture_scope in {"SYSTEM", "PROGRAM"}:
        level = max(level, 4)
        reasons.append("system/program architecture")
    elif signals.architecture_scope == "SUBSYSTEM":
        level = max(level, 3)
        reasons.append("subsystem architecture")
    elif signals.architecture_scope == "LOCAL":
        level = max(level, 1)
        reasons.append("local design change")
    if signals.migration_scope == "IRREVERSIBLE":
        level = 4
        reasons.append("irreversible migration")
    elif signals.migration_scope == "PERSISTENT":
        level = max(level, 3)
        reasons.append("persistent-state migration")
    elif signals.migration_scope == "REVERSIBLE":
        level = max(level, 2)
        reasons.append("reversible migration")
    if signals.security_trust_boundary or signals.destructive or signals.criticality is Criticality.CRITICAL:
        level = 4
        reasons.append("critical consequence/trust/destructive floor")
    if signals.production_policy:
        level = max(level, 3)
        reasons.append("production/release policy change")
    qa = "SELF_VERIFY" if level <= 1 and signals.criticality <= Criticality.MODERATE else "INDEPENDENT"
    if level == 4 or signals.criticality is Criticality.CRITICAL:
        qa = "HIGH_ASSURANCE"
    return RouteDecision(level, qa, tuple(reasons))
