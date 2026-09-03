"""Integration freshness/conflict classification."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum


class IntegrationConflict(str, Enum):
    NONE = "NONE"
    SYNTACTIC = "SYNTACTIC"
    SEMANTIC = "SEMANTIC"
    CONTRACT = "CONTRACT"
    SOURCE_STALENESS = "SOURCE_STALENESS"


@dataclass(frozen=True)
class IntegrationCheck:
    base_sha_changed: bool = False
    source_fingerprints_changed: bool = False
    overlapping_paths: bool = False
    interface_contract_changed: bool = False
    merge_conflict: bool = False


def classify(check: IntegrationCheck) -> IntegrationConflict:
    if check.merge_conflict:
        return IntegrationConflict.SYNTACTIC
    if check.source_fingerprints_changed or check.base_sha_changed:
        return IntegrationConflict.SOURCE_STALENESS
    if check.interface_contract_changed:
        return IntegrationConflict.CONTRACT
    if check.overlapping_paths:
        return IntegrationConflict.SEMANTIC
    return IntegrationConflict.NONE
