"""Repository-native ownership/ruleset signals as evidence, never semantic authority."""
from __future__ import annotations

import fnmatch
from dataclasses import dataclass
from typing import Iterable

@dataclass(frozen=True)
class CodeownerEntry:
    pattern: str
    owners: tuple[str, ...]
    line: int

@dataclass(frozen=True)
class OwnershipObservation:
    path: str
    authoritative_owner: str
    observed_codeowners: tuple[str, ...]
    source: str
    conflict: bool

@dataclass(frozen=True)
class RulesetObservation:
    source_ref: str
    required_status_checks: tuple[str, ...]
    required_approvals: int
    restrict_force_push: bool
    restrict_deletion: bool

def parse_codeowners(text: str) -> list[CodeownerEntry]:
    entries=[]
    for number, raw in enumerate(text.splitlines(),1):
        stripped=raw.strip()
        if not stripped or stripped.startswith("#"): continue
        parts=stripped.split()
        if len(parts)<2: continue
        pattern,*owners=parts
        if pattern.startswith("!"): continue
        entries.append(CodeownerEntry(pattern,tuple(owners),number))
    return entries

def _matches_codeowners(path: str, pattern: str) -> bool:
    normalized=path.lstrip("/"); pat=pattern.lstrip("/")
    if pat.endswith("/"): pat += "**"
    if "/" not in pat.rstrip("/"): return fnmatch.fnmatchcase(normalized.rsplit("/",1)[-1],pat)
    return fnmatch.fnmatchcase(normalized,pat)

def codeowner_candidates(path: str, entries: Iterable[CodeownerEntry]) -> tuple[str,...]:
    matched=None
    for entry in entries:
        if _matches_codeowners(path,entry.pattern): matched=entry
    return () if matched is None else matched.owners

def observe_ownership(path: str, yaaw_owner: str, *, codeowners: Iterable[str]=(), source: str="CODEOWNERS") -> OwnershipObservation:
    observed=tuple(dict.fromkeys(codeowners)); conflict=bool(observed) and yaaw_owner not in observed and yaaw_owner!="UNKNOWN_OWNER"
    return OwnershipObservation(path,yaaw_owner,observed,source,conflict)

def normalize_ruleset(source_ref: str, ruleset: dict) -> RulesetObservation:
    checks=[]; approvals=0; restrict_force_push=False; restrict_deletion=False
    for rule in ruleset.get("rules",[]):
        kind=rule.get("type"); params=rule.get("parameters") or {}
        if kind=="required_status_checks":
            for item in params.get("required_status_checks",[]):
                if item.get("context"): checks.append(str(item["context"]))
        elif kind=="pull_request": approvals=max(approvals,int(params.get("required_approving_review_count",0)))
        elif kind=="non_fast_forward": restrict_force_push=True
        elif kind=="deletion": restrict_deletion=True
    return RulesetObservation(source_ref,tuple(sorted(set(checks))),approvals,restrict_force_push,restrict_deletion)
