"""Runtime security primitives: command risk, capabilities, egress and secret redaction."""
from __future__ import annotations

import fnmatch
import re
from dataclasses import dataclass
from enum import IntEnum
from urllib.parse import urlparse


class SecurityError(PermissionError):
    pass


class CommandRisk(IntEnum):
    READ_ONLY = 0
    LOCAL_MUTATION = 1
    DEPENDENCY_MUTATION = 2
    NETWORK_SIDE_EFFECT = 3
    REPOSITORY_SIDE_EFFECT = 4
    PRODUCTION_SIDE_EFFECT = 5
    DESTRUCTIVE = 6


_DESTRUCTIVE = [
    re.compile(r"(^|\s)rm\s+-rf(\s|$)"),
    re.compile(r"\bgit\s+push\b.*\s--force(?:-with-lease)?\b"),
    re.compile(r"\bgit\s+reset\s+--hard\b"),
    re.compile(r"\b(?:DROP|TRUNCATE)\s+(?:TABLE|DATABASE)\b", re.I),
    re.compile(r"\bterraform\s+destroy\b"),
    re.compile(r"\bkubectl\s+delete\b"),
]


@dataclass(frozen=True)
class RoleCapabilities:
    max_command_risk: CommandRisk
    network: bool = False
    production: bool = False
    mutate_repo: bool = False
    mutate_product_code: bool = False


def inferred_minimum_risk(command: str) -> CommandRisk:
    if any(p.search(command) for p in _DESTRUCTIVE):
        return CommandRisk.DESTRUCTIVE
    if re.search(r"\bgit\s+(push|tag|branch\s+-D)\b", command):
        return CommandRisk.REPOSITORY_SIDE_EFFECT
    if re.search(r"\b(?:curl|wget|http|https)\b", command):
        return CommandRisk.NETWORK_SIDE_EFFECT
    if re.search(r"\b(?:npm|pnpm|yarn|pip|uv|cargo)\s+(?:install|add|remove|update)\b", command):
        return CommandRisk.DEPENDENCY_MUTATION
    if re.search(r"(^|\s)(?:sed\s+-i|mv|cp|mkdir|touch|rm)(\s|$)", command):
        return CommandRisk.LOCAL_MUTATION
    return CommandRisk.READ_ONLY


def authorize_command(command: str, declared: CommandRisk, capabilities: RoleCapabilities) -> None:
    inferred = inferred_minimum_risk(command)
    effective = max(declared, inferred)
    if effective > capabilities.max_command_risk:
        raise SecurityError(f"command risk {CommandRisk(effective).name} exceeds role maximum {capabilities.max_command_risk.name}")
    if effective >= CommandRisk.NETWORK_SIDE_EFFECT and not capabilities.network:
        raise SecurityError("network side effects are not permitted for this role")
    if effective >= CommandRisk.PRODUCTION_SIDE_EFFECT and not capabilities.production:
        raise SecurityError("production side effects are not permitted for this role")
    if effective >= CommandRisk.REPOSITORY_SIDE_EFFECT and not capabilities.mutate_repo:
        raise SecurityError("repository side effects are not permitted for this role")


@dataclass(frozen=True)
class EgressPolicy:
    allowed: bool
    domains: tuple[str, ...] = ()
    mutation_requests: bool = False

    def authorize(self, url: str, mutation: bool = False) -> None:
        if not self.allowed:
            raise SecurityError("network egress disabled")
        host = (urlparse(url).hostname or "").lower()
        if not host:
            raise SecurityError("URL has no hostname")
        if self.domains and not any(fnmatch.fnmatchcase(host, pattern.lower()) for pattern in self.domains):
            raise SecurityError(f"egress host {host!r} is not allowlisted")
        if mutation and not self.mutation_requests:
            raise SecurityError("network mutation requests are disabled")


_SECRET_PATTERNS = [
    re.compile(r"(?i)(api[_-]?key|token|password|secret)\s*[:=]\s*(['\"]?)([^\s'\"]+)\2"),
    re.compile(r"\bgh[pousr]_[A-Za-z0-9_]{20,}\b"),
    re.compile(r"\bsk-[A-Za-z0-9_-]{20,}\b"),
]


def redact_secrets(text: str) -> str:
    redacted = text
    for pattern in _SECRET_PATTERNS:
        if pattern.groups >= 3:
            redacted = pattern.sub(lambda m: f"{m.group(1)}=[REDACTED]", redacted)
        else:
            redacted = pattern.sub("[REDACTED]", redacted)
    return redacted
