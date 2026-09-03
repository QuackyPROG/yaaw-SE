"""Structured executable evidence with provenance and freshness semantics."""
from __future__ import annotations

from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from typing import Iterable


@dataclass(frozen=True)
class EvidenceRecord:
    verification_id: str
    command: str
    exit_code: int
    environment: str
    commit: str
    timestamp: str
    source_fingerprints: dict[str, str]
    evidence_kind: str = "EXECUTABLE"

    @classmethod
    def create(
        cls,
        verification_id: str,
        command: str,
        exit_code: int,
        environment: str,
        commit: str,
        source_fingerprints: dict[str, str] | None = None,
        evidence_kind: str = "EXECUTABLE",
    ) -> "EvidenceRecord":
        if not verification_id.strip() or not command.strip() or not environment.strip() or not commit.strip():
            raise ValueError("evidence requires verification id, command, environment and commit")
        return cls(
            verification_id=verification_id,
            command=command,
            exit_code=int(exit_code),
            environment=environment,
            commit=commit,
            timestamp=datetime.now(timezone.utc).isoformat(),
            source_fingerprints=dict(source_fingerprints or {}),
            evidence_kind=evidence_kind,
        )

    @property
    def passed(self) -> bool:
        return self.exit_code == 0

    def to_dict(self) -> dict:
        return asdict(self)


def evidence_fresh(record: EvidenceRecord, commit: str, source_fingerprints: dict[str, str]) -> bool:
    return record.commit == commit and record.source_fingerprints == source_fingerprints


def require_passing_evidence(
    records: Iterable[EvidenceRecord],
    required_ids: Iterable[str],
    commit: str,
    source_fingerprints: dict[str, str],
) -> list[str]:
    errors: list[str] = []
    by_id: dict[str, list[EvidenceRecord]] = {}
    for record in records:
        by_id.setdefault(record.verification_id, []).append(record)
    for verification_id in sorted(set(required_ids)):
        candidates = by_id.get(verification_id, [])
        if not candidates:
            errors.append(f"missing evidence: {verification_id}")
            continue
        fresh = [r for r in candidates if evidence_fresh(r, commit, source_fingerprints)]
        if not fresh:
            errors.append(f"stale evidence: {verification_id}")
            continue
        if not any(r.passed for r in fresh):
            errors.append(f"failing evidence: {verification_id}")
    return errors
