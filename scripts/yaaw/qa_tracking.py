"""Stable QA finding, residual-risk and failure-signature identities across repair cycles."""
from __future__ import annotations

import hashlib
import re
from dataclasses import dataclass, replace
from typing import Iterable

_SPACE = re.compile(r"\s+")


def _normalized(value: str) -> str:
    return _SPACE.sub(" ", value.strip().lower())


def stable_signature(*parts: str) -> str:
    payload = "\x1f".join(_normalized(part) for part in parts)
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()[:12]


@dataclass(frozen=True)
class QAFinding:
    id: str
    ticket: str
    severity: str
    summary: str
    signature: str
    status: str = "OPEN"
    first_seen_cycle: int = 1
    last_seen_cycle: int = 1


@dataclass(frozen=True)
class ResidualRisk:
    id: str
    ticket: str
    summary: str
    signature: str
    disposition: str = "UNRESOLVED"


def finding_id(ticket: str, severity: str, summary: str) -> str:
    return f"QA-{ticket}-{stable_signature(severity, summary)[:8].upper()}"


def residual_risk_id(ticket: str, summary: str) -> str:
    return f"RR-{ticket}-{stable_signature(summary)[:8].upper()}"


def make_finding(ticket: str, severity: str, summary: str, cycle: int = 1) -> QAFinding:
    signature = stable_signature(severity, summary)
    return QAFinding(finding_id(ticket, severity, summary), ticket, severity, summary, signature, "OPEN", cycle, cycle)


def make_residual_risk(ticket: str, summary: str) -> ResidualRisk:
    signature = stable_signature(summary)
    return ResidualRisk(residual_risk_id(ticket, summary), ticket, summary, signature)


def reconcile_findings(ticket: str, previous: Iterable[QAFinding], current: Iterable[dict], cycle: int) -> list[QAFinding]:
    if cycle < 1:
        raise ValueError("cycle must be >= 1")
    prior = {item.signature: item for item in previous}
    seen: set[str] = set()
    result: list[QAFinding] = []
    for raw in current:
        severity = str(raw["severity"]).upper()
        summary = str(raw["summary"]).strip()
        signature = stable_signature(severity, summary)
        if signature in seen:
            continue
        seen.add(signature)
        old = prior.get(signature)
        result.append(
            replace(old, severity=severity, summary=summary, status="OPEN", last_seen_cycle=cycle)
            if old
            else make_finding(ticket, severity, summary, cycle)
        )
    for signature, old in prior.items():
        if signature not in seen and old.status == "OPEN":
            result.append(replace(old, status="RESOLVED", last_seen_cycle=cycle))
    return sorted(result, key=lambda item: item.id)
