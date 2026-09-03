"""Risk-to-evidence requirements and QA admission decisions."""
from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path

from .evidence import EvidenceRecord, require_passing_evidence


@dataclass(frozen=True)
class RiskRequirement:
    risk: str
    verification_ids: tuple[str, ...]
    integration_qa: bool = False
    rollback_required: bool = False
    real_dependency_preferred: bool = False


class AssurancePolicy:
    def __init__(self, requirements: dict[str, RiskRequirement], default_ids: tuple[str, ...] = ()):
        self.requirements = requirements
        self.default_ids = default_ids

    @classmethod
    def load(cls, path: Path) -> "AssurancePolicy":
        data = json.loads(path.read_text(encoding="utf-8"))
        if data.get("schema") != "yaaw.qa-risk-matrix/v1":
            raise ValueError("unsupported QA risk matrix schema")
        requirements = {}
        for risk, spec in data.get("risks", {}).items():
            requirements[risk] = RiskRequirement(
                risk=risk,
                verification_ids=tuple(spec.get("verification_ids", [])),
                integration_qa=bool(spec.get("integration_qa", False)),
                rollback_required=bool(spec.get("rollback_required", False)),
                real_dependency_preferred=bool(spec.get("real_dependency_preferred", False)),
            )
        return cls(requirements, tuple(data.get("default_verification_ids", [])))

    def required_ids(self, risks: list[str], qa_profile: str) -> list[str]:
        ids = set(self.default_ids)
        for risk in risks:
            requirement = self.requirements.get(risk)
            if requirement:
                ids.update(requirement.verification_ids)
        if qa_profile == "HIGH_ASSURANCE" and not ids:
            ids.add("targeted")
        return sorted(ids)

    def requires_integration_qa(self, risks: list[str], qa_profile: str) -> bool:
        return qa_profile == "HIGH_ASSURANCE" or any(
            self.requirements.get(risk, RiskRequirement(risk, ())).integration_qa for risk in risks
        )

    def requires_rollback(self, risks: list[str]) -> bool:
        return any(self.requirements.get(risk, RiskRequirement(risk, ())).rollback_required for risk in risks)


def qa_admission_errors(
    policy: AssurancePolicy,
    risks: list[str],
    qa_profile: str,
    records: list[EvidenceRecord],
    commit: str,
    source_fingerprints: dict[str, str],
) -> list[str]:
    required = policy.required_ids(risks, qa_profile)
    return require_passing_evidence(records, required, commit, source_fingerprints)
