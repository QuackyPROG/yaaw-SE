# Invalidation propagation

Accepted artifacts are historical records, not eternally valid truth. Prior reviews remain immutable historical evidence; current authority may become `STALE` without rewriting history.

## Permanent rule

**A stale contract and stale acceptance are not the same thing.**

## Acceptance invalidation
If product/engineering/spec/ticket meaning remains current but review or verification proof is missing, repository-stale, or cannot be reproduced, preserve historical reviews and reconcile current acceptance to `REVIEW_REQUIRED`.

Repository identity mismatch alone does not establish `REPLAN_REQUIRED`. Reviewer may return `PASS`, `REPAIR`, `REPLAN`, or `BLOCKED`.

Stable acceptance causes: `REVIEW_MISSING`, `REVIEW_REPOSITORY_STALE`, `VERIFICATION_MISSING`, `VERIFICATION_REPOSITORY_STALE`, `LEGACY_IDENTITY_UNVERIFIABLE`.

## Framework integrity is not project invalidation
Package-managed framework drift is neither contract invalidation nor acceptance invalidation. It means the execution engine is untrusted. Stop orchestration with the typed framework failure and use installer repair. Do not route framework drift to Planner or Reviewer and do not change ticket lifecycle state to encode it.

Result: `PASS -> REPLAN_REQUIRED`.

Next semantic owner: Planner.

### Acceptance invalidation
The source contract remains current, but review or verification proof is missing, repository-stale, or cannot be reproduced under the canonical identity algorithm.

Result: `PASS -> REVIEW_REQUIRED`.

Next semantic owner: Reviewer.

Repository identity mismatch alone does not establish `REPLAN_REQUIRED`. The Orchestrator may mechanically invalidate trust, but it must not decide that current code satisfies the contract or that architecture is invalid.

Reviewer may then return `PASS`, `REPAIR`, `REPLAN`, or `BLOCKED`.

## Stable cause IDs

Contract causes: `PRODUCT_SOURCE_STALE`, `ENGINEERING_SOURCE_STALE`, `SPEC_SOURCE_STALE`, `TICKET_SOURCE_STALE`, `CONTRACT_INVALIDATED`.

Acceptance causes: `REVIEW_MISSING`, `REVIEW_REPOSITORY_STALE`, `VERIFICATION_MISSING`, `VERIFICATION_REPOSITORY_STALE`, `LEGACY_IDENTITY_UNVERIFIABLE`.

Every invalidation records a stable cause plus human-readable evidence. Runtime-looking paths are not automatically acceptance-irrelevant.

## Framework integrity is not acceptance invalidation

Package-managed framework drift is neither contract invalidation nor acceptance invalidation. It means the execution engine is not trusted. Stop orchestration with the typed framework failure and use installer repair. Do not route framework drift to Planner or Reviewer and do not change ticket lifecycle state to encode it.
