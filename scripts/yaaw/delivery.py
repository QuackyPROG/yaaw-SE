"""Delivery state, environment promotion, rollback and observed-provider truth."""
from __future__ import annotations

from dataclasses import dataclass
from enum import IntEnum

from .approvals import ApprovalRecord, require_approval


class DeliveryError(RuntimeError):
    pass


class DeliveryStage(IntEnum):
    IMPLEMENTED = 0
    VERIFIED = 1
    ACCEPTED = 2
    COMMITTED = 3
    INTEGRATED = 4
    DEPLOYED = 5


@dataclass(frozen=True)
class EnvironmentPolicy:
    id: str
    promotion_authority: str | None = None
    requires_provider_observation: bool = False
    requires_rollback: bool = False


@dataclass(frozen=True)
class DeliveryRecord:
    work_id: str
    base_sha: str
    head_sha: str
    stage: DeliveryStage
    environment: str
    qa_result: str
    provider_observed: bool = False
    rollback_ref: str | None = None
    ci_ref: str | None = None
    integration_ref: str | None = None

    def validate(self, policy: EnvironmentPolicy, approvals: list[ApprovalRecord] | None = None) -> None:
        if not self.work_id or not self.base_sha or not self.head_sha:
            raise DeliveryError("delivery record requires work/base/head identity")
        if self.qa_result not in {"PASS", "QA_NOT_REQUIRED_BY_ROUTE"}:
            raise DeliveryError(f"delivery blocked by QA result {self.qa_result!r}")
        if self.stage >= DeliveryStage.DEPLOYED and policy.requires_provider_observation and not self.provider_observed:
            raise DeliveryError("DEPLOYED requires actual provider/environment observation")
        if policy.requires_rollback and not self.rollback_ref:
            raise DeliveryError("environment/risk policy requires rollback reference")
        if policy.promotion_authority and self.stage >= DeliveryStage.DEPLOYED:
            try:
                require_approval(approvals or [], policy.promotion_authority, "PROMOTE", policy.id)
            except PermissionError as exc:
                raise DeliveryError(str(exc)) from exc


def release_engineer_required(*, multi_branch: bool, required_ci: bool, environment: str, promotion: bool) -> bool:
    return multi_branch or required_ci or promotion or environment not in {"LOCAL", ""}
