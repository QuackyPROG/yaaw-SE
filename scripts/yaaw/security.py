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
    re.compile(r"\bgit\s+clean\b[^\n;&|]*-[^\s]*f"),
    re.compile(r"\bgit\s+branch\s+-D\b"),
    re.compile(r"\b(?:DROP|TRUNCATE)\s+(?:TABLE|DATABASE)\b", re.I),
    re.compile(r"\bterraform\s+destroy\b"),
    re.compile(r"\bkubectl\s+delete\b"),
]

_PRODUCTION_MUTATION = [
    re.compile(r"\bterraform\s+apply\b"),
    re.compile(r"\bkubectl\s+(?:apply|patch|replace|create|rollout|scale|set)\b"),
    re.compile(r"\bvercel\s+(?:deploy|promote)\b|\bvercel\b[^\n;&|]*--prod\b"),
    re.compile(r"\bfly(?:ctl)?\s+deploy\b"),
    re.compile(r"\b(?:aws|gcloud|az)\b[^\n;&|]*\b(?:create|update|delete|deploy|apply|put|set|attach|detach|terminate|restart)\b"),
]

_REPOSITORY_REMOTE_MUTATION = [
    re.compile(r"\bgit\s+push\b"),
    re.compile(r"\bgh\s+(?:release\s+(?:create|edit|delete)|pr\s+merge)\b"),
]

_DEPENDENCY_MUTATION = re.compile(r"\b(?:npm|pnpm|yarn|pip|uv|cargo)\s+(?:install|add|remove|update|uninstall|ci)\b")
_NETWORK_USE = [
    re.compile(r"\b(?:curl|wget)\b"),
    re.compile(r"\bgit\s+(?:clone|fetch|pull|push)\b"),
    _DEPENDENCY_MUTATION,
    re.compile(r"\bterraform\s+(?:init|plan|apply|destroy)\b"),
    re.compile(r"\bkubectl\b"),
    re.compile(r"\b(?:vercel|fly|flyctl|aws|gcloud|az)\b"),
    re.compile(r"\bdocker\s+push\b"),
]
_LOCAL_MUTATION = [
    re.compile(r"(^|\s)(?:sed\s+-i|mv|cp|mkdir|touch|rm|chmod|chown)(\s|$)"),
    re.compile(r"\bgit\s+(?:add|commit|merge|rebase|cherry-pick|checkout|switch|branch|tag|stash|restore)\b"),
]


@dataclass(frozen=True)
class RoleCapabilities:
    max_command_risk: CommandRisk
    network: bool = False
    production: bool = False
    mutate_repo: bool = False
    mutate_product_code: bool = False


@dataclass(frozen=True)
class CommandEffects:
    risk: CommandRisk
    network: bool
    production: bool
    repository_remote_mutation: bool


def command_effects(command: str) -> CommandEffects:
    destructive = any(pattern.search(command) for pattern in _DESTRUCTIVE)
    production = any(pattern.search(command) for pattern in _PRODUCTION_MUTATION) or bool(re.search(r"\bterraform\s+destroy\b|\bkubectl\s+delete\b", command))
    repository = any(pattern.search(command) for pattern in _REPOSITORY_REMOTE_MUTATION)
    dependency = bool(_DEPENDENCY_MUTATION.search(command))
    network = any(pattern.search(command) for pattern in _NETWORK_USE) or repository or production

    if destructive:
        risk = CommandRisk.DESTRUCTIVE
    elif production:
        risk = CommandRisk.PRODUCTION_SIDE_EFFECT
    elif repository:
        risk = CommandRisk.REPOSITORY_SIDE_EFFECT
    elif dependency:
        risk = CommandRisk.DEPENDENCY_MUTATION
    elif network:
        risk = CommandRisk.NETWORK_SIDE_EFFECT
    elif any(pattern.search(command) for pattern in _LOCAL_MUTATION):
        risk = CommandRisk.LOCAL_MUTATION
    else:
        risk = CommandRisk.READ_ONLY
    return CommandEffects(risk, network, production, repository)


def inferred_minimum_risk(command: str) -> CommandRisk:
    return command_effects(command).risk


def authorize_command(command: str, declared: CommandRisk, capabilities: RoleCapabilities) -> None:
    """Enforce the greater declared/inferred severity plus orthogonal side-effect capabilities.

    Severity is ordered, but side-effect dimensions are not: a local destructive command
    does not inherently need network/production/repository capability, while a package
    install may require network capability despite having lower severity than NETWORK_SIDE_EFFECT.
    """
    effects = command_effects(command)
    effective = max(declared, effects.risk)
    if effective > capabilities.max_command_risk:
        raise SecurityError(f"command risk {CommandRisk(effective).name} exceeds role maximum {capabilities.max_command_risk.name}")

    declared_network = declared in {CommandRisk.NETWORK_SIDE_EFFECT, CommandRisk.REPOSITORY_SIDE_EFFECT, CommandRisk.PRODUCTION_SIDE_EFFECT}
    declared_repository = declared is CommandRisk.REPOSITORY_SIDE_EFFECT
    declared_production = declared is CommandRisk.PRODUCTION_SIDE_EFFECT

    if (effects.network or declared_network) and not capabilities.network:
        raise SecurityError("network side effects/access are not permitted for this role")
    if (effects.production or declared_production) and not capabilities.production:
        raise SecurityError("production/provider mutation is not permitted for this role")
    if (effects.repository_remote_mutation or declared_repository) and not capabilities.mutate_repo:
        raise SecurityError("remote repository side effects are not permitted for this role")


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
