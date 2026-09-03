"""Typed retry policy so transient tool failures are not confused with engineering failures."""
from __future__ import annotations

from enum import Enum


class FailureClass(str, Enum):
    NETWORK_TRANSIENT = "NETWORK_TRANSIENT"
    PROVIDER_TRANSIENT = "PROVIDER_TRANSIENT"
    FLAKY_TEST_SUSPECTED = "FLAKY_TEST_SUSPECTED"
    ENVIRONMENT_MISSING = "ENVIRONMENT_MISSING"
    CONTRACT_INVALID = "CONTRACT_INVALID"
    TEST_FAILURE = "TEST_FAILURE"
    SAME_FAILURE_REPEATED = "SAME_FAILURE_REPEATED"
    SECURITY_DENIED = "SECURITY_DENIED"
    HUMAN_AUTHORITY_REQUIRED = "HUMAN_AUTHORITY_REQUIRED"


DEFAULT_RETRY_LIMITS = {
    FailureClass.NETWORK_TRANSIENT: 2,
    FailureClass.PROVIDER_TRANSIENT: 2,
    FailureClass.FLAKY_TEST_SUSPECTED: 1,
    FailureClass.ENVIRONMENT_MISSING: 0,
    FailureClass.CONTRACT_INVALID: 0,
    FailureClass.TEST_FAILURE: 0,
    FailureClass.SAME_FAILURE_REPEATED: 0,
    FailureClass.SECURITY_DENIED: 0,
    FailureClass.HUMAN_AUTHORITY_REQUIRED: 0,
}


def may_retry(kind: FailureClass, attempts: int, limits: dict[FailureClass, int] | None = None) -> bool:
    limit = (limits or DEFAULT_RETRY_LIMITS).get(kind, 0)
    return attempts < limit
