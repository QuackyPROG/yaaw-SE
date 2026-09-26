# Invalidation propagation

Prior reviews remain immutable historical evidence; current authority may become STALE without rewriting history.

## Contract staleness
For executable ticket states `READY`, `IN_PROGRESS`, `REVIEW_REQUIRED`, `REPAIR_REQUIRED`, and `PASS`, compare ticket product/engineering/spec revisions to current adopted sources before dispatch. Stable causes are `PRODUCT_SOURCE_STALE`, `ENGINEERING_SOURCE_STALE`, `SPEC_SOURCE_STALE`, `TICKET_SOURCE_STALE`, and `CONTRACT_INVALIDATED`. Their route is read from `routing-policy.json`; the current contract route is `REPLAN_REQUIRED`, and Orchestrator does not hard-code a second destination.

## Acceptance staleness
When source meaning remains current but current PASS verification/review repository identity is missing, stale, or legacy-unverifiable, preserve history and return current lifecycle authority to `REVIEW_REQUIRED`. Stable causes are `REVIEW_MISSING`, `REVIEW_REPOSITORY_STALE`, `VERIFICATION_MISSING`, `VERIFICATION_REPOSITORY_STALE`, and `LEGACY_IDENTITY_UNVERIFIABLE`.

Repository identity mismatch alone never proves an architecture replan is required.

Framework drift is neither contract nor acceptance invalidation. It stops orchestration fail-closed for installer repair.
