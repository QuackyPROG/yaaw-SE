"""Explicit, expiring policy exceptions; absence never means waiver."""
from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone


class PolicyExceptionError(PermissionError):
    pass


@dataclass(frozen=True)
class PolicyException:
    policy: str
    authority: str
    reference: str
    expires_at: str
    reason: str

    def active(self, now: datetime | None = None) -> bool:
        current = now or datetime.now(timezone.utc)
        expiry = datetime.fromisoformat(self.expires_at.replace("Z", "+00:00"))
        if expiry.tzinfo is None:
            expiry = expiry.replace(tzinfo=timezone.utc)
        return current <= expiry


def require_exception(items: list[PolicyException], policy: str, authority: str) -> PolicyException:
    for item in reversed(items):
        if item.policy == policy and item.authority == authority and item.reference.strip() and item.active():
            return item
    raise PolicyExceptionError(f"no active authorized exception for {policy}")
