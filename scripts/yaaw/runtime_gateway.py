"""Executable admission gateway for agent dispatches and side-effecting actions.

The gateway composes existing deterministic policy. It does not replace the ticket
state machine, authority registry, ownership registry, scope rules or command-risk
classifier. Runtime adapters should route mutating/side-effecting execution through
this module when the host runtime supports an enforceable wrapper.
"""
from __future__ import annotations

import json
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Callable, TypeVar

from .authority import AuthorityPolicy
from .controller import AdmissionError, Controller
from .ownership import OwnershipRule, resolve
from .security import CommandRisk, RoleCapabilities, SecurityError, authorize_command, command_effects, redact_secrets

T = TypeVar("T")


class GatewayDenied(PermissionError):
    pass


def _matches_scope(path: str, allowed: tuple[str, ...], forbidden: tuple[str, ...]) -> list[str]:
    from .ownership import matches

    if forbidden and any(matches(path, pattern) for pattern in forbidden):
        return [f"FORBIDDEN {path}"]
    if not allowed or not any(matches(path, pattern) for pattern in allowed):
        return [f"OUTSIDE_ALLOWED {path}"]
    return []


def load_role_capabilities(path: Path, role: str) -> RoleCapabilities:
    data = json.loads(path.read_text(encoding="utf-8"))
    spec = data.get("roles", {}).get(role)
    if spec is None:
        raise GatewayDenied(f"role {role!r} has no registered security policy")
    try:
        risk = CommandRisk[str(spec["max_command_risk"])]
    except (KeyError, ValueError) as exc:
        raise GatewayDenied(f"role {role!r} has invalid max_command_risk policy") from exc
    return RoleCapabilities(
        max_command_risk=risk,
        network=bool(spec.get("network", False)),
        production=bool(spec.get("production", False)),
        mutate_repo=bool(spec.get("mutate_repo", False)),
        mutate_product_code=bool(spec.get("mutate_product_code", False)),
    )


@dataclass(frozen=True)
class ActionRequest:
    ticket_id: str
    role: str
    holder: str
    worktree: str
    command: str | None = None
    declared_risk: CommandRisk = CommandRisk.READ_ONLY
    paths: tuple[str, ...] = ()
    allowed_paths: tuple[str, ...] = ()
    forbidden_paths: tuple[str, ...] = ()
    artifact: str | None = None
    field: str | None = None
    product_mutation: bool = False
    sources_current: bool = True
    base_sha: str | None = None


@dataclass(frozen=True)
class AdmissionDecision:
    allowed: bool
    code: str
    reasons: tuple[str, ...]
    effective_risk: str
    requires_dispatch: bool
    reserved: bool = False
    redacted_command: str | None = None

    def to_dict(self) -> dict:
        return asdict(self)


class RuntimeGateway:
    def __init__(
        self,
        controller: Controller,
        authority: AuthorityPolicy,
        ownership_rules: list[OwnershipRule],
        default_owner: str,
        role_capabilities: dict[str, RoleCapabilities],
    ) -> None:
        self.controller = controller
        self.authority = authority
        self.ownership_rules = ownership_rules
        self.default_owner = default_owner
        self.role_capabilities = role_capabilities

    @classmethod
    def from_repository(
        cls,
        controller: Controller,
        *,
        authority_path: Path = Path(".agents/authority.json"),
        ownership_path: Path = Path(".agents/ownership.json"),
        security_path: Path = Path("config/security-policy.json"),
    ) -> "RuntimeGateway":
        from .query import load_ownership_rules

        rules, default_owner = load_ownership_rules(ownership_path)
        security = json.loads(security_path.read_text(encoding="utf-8"))
        role_caps: dict[str, RoleCapabilities] = {}
        for role in security.get("roles", {}):
            role_caps[role] = load_role_capabilities(security_path, role)
        return cls(controller, AuthorityPolicy.load(authority_path), rules, default_owner, role_caps)

    def _requires_dispatch(self, request: ActionRequest) -> tuple[bool, CommandRisk]:
        effects = command_effects(request.command or "")
        effective = max(request.declared_risk, effects.risk)
        requires = bool(
            request.paths
            or request.artifact
            or request.product_mutation
            or effective > CommandRisk.READ_ONLY
        )
        return requires, CommandRisk(effective)

    def inspect(self, request: ActionRequest) -> AdmissionDecision:
        reasons: list[str] = []
        requires_dispatch, effective_risk = self._requires_dispatch(request)
        redacted = redact_secrets(request.command) if request.command else None

        ticket = None
        if requires_dispatch:
            try:
                ticket = self.controller.preflight_dispatch(request.ticket_id, sources_current=request.sources_current)
            except AdmissionError as exc:
                reasons.append(str(exc))

        caps = self.role_capabilities.get(request.role)
        if caps is None:
            reasons.append(f"role {request.role!r} has no registered security policy")
        else:
            if request.product_mutation and not caps.mutate_product_code:
                reasons.append(f"role {request.role!r} may not mutate product code")
            if request.command:
                try:
                    authorize_command(request.command, request.declared_risk, caps)
                except SecurityError as exc:
                    reasons.append(str(exc))

        if request.artifact:
            try:
                self.authority.require_mutation(request.role, request.artifact, request.field)
            except PermissionError as exc:
                reasons.append(str(exc))

        if request.paths:
            if not request.allowed_paths:
                reasons.append("path mutation/access request is missing an allowed scope")
            for path in request.paths:
                reasons.extend(_matches_scope(path, request.allowed_paths, request.forbidden_paths))
                ownership = resolve(path, self.ownership_rules, self.default_owner)
                if ownership.deny:
                    reasons.append(f"ownership denies path {path}")
                    continue
                if ownership.owner == "UNKNOWN_OWNER":
                    reasons.append(f"unresolved ownership for {path}")
                    continue
                if ticket is not None and ticket.owner not in {ownership.owner, *ownership.co_owners}:
                    reasons.append(
                        f"ticket owner {ticket.owner!r} does not own {path}; resolved owner is {ownership.owner!r}"
                    )

        if reasons:
            return AdmissionDecision(
                False,
                "DENIED",
                tuple(dict.fromkeys(reasons)),
                effective_risk.name,
                requires_dispatch,
                False,
                redacted,
            )
        return AdmissionDecision(True, "ALLOW", (), effective_risk.name, requires_dispatch, False, redacted)

    def admit(self, request: ActionRequest) -> AdmissionDecision:
        inspected = self.inspect(request)
        if not inspected.allowed or not inspected.requires_dispatch:
            return inspected
        try:
            self.controller.admit_dispatch(
                request.ticket_id,
                request.holder,
                request.worktree,
                sources_current=request.sources_current,
                base_sha=request.base_sha,
                role=request.role,
            )
        except (AdmissionError, RuntimeError) as exc:
            return AdmissionDecision(
                False,
                "DENIED",
                (str(exc),),
                inspected.effective_risk,
                True,
                False,
                inspected.redacted_command,
            )
        return AdmissionDecision(
            True,
            "ALLOW",
            (),
            inspected.effective_risk,
            True,
            True,
            inspected.redacted_command,
        )

    def release(self, request: ActionRequest, decision: AdmissionDecision) -> None:
        if decision.reserved:
            self.controller.release_dispatch(request.worktree, request.holder)

    def run(self, request: ActionRequest, runner: Callable[[ActionRequest], T]) -> T:
        """Authorize, reserve, execute through the injected runtime runner, then release.

        Runtime adapters should expose their mutating execution capability through this
        method (or an equivalent wrapper around ``admit``/``release``). The injected
        runner is the provider/OS boundary; tests can replace it with a deterministic
        fake without weakening admission semantics.
        """
        decision = self.admit(request)
        if not decision.allowed:
            detail = "; ".join(decision.reasons) or "runtime gateway denied action"
            raise GatewayDenied(detail)
        try:
            return runner(request)
        finally:
            self.release(request, decision)
