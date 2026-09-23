# Invalidation propagation

Accepted artifacts are historical records, not eternally valid truth. When an upstream basis changes, preserve history and invalidate downstream trust explicitly.

## Product revision change
1. Increment `product.md` revision and record the changed requirement.
2. Identify `ENG-*` decisions whose product provenance depends on the changed requirement.
3. Mark affected decisions superseded/invalidated in `engineering.md`; move planning readiness to unresolved.
4. Mark dependent specs `STALE` rather than rewriting them in place.
5. Move dependent tickets, including prior `PASS` tickets when behavior is affected, to `REPLAN_REQUIRED` using the transition contract.
6. Prior reviews remain immutable historical evidence but no longer establish current acceptance.

## Engineering decision change
Apply the same propagation from affected `ENG-*` decisions -> specs -> tickets -> reviews.

## Acceptance invalidation
If product/engineering/spec/ticket meaning remains current but review or verification proof is missing, repository-stale, or cannot be reproduced, preserve historical reviews and reconcile current acceptance to `REVIEW_REQUIRED`.

Repository identity mismatch alone does not establish `REPLAN_REQUIRED`. Reviewer may return `PASS`, `REPAIR`, `REPLAN`, or `BLOCKED`.

Stable acceptance causes: `REVIEW_MISSING`, `REVIEW_REPOSITORY_STALE`, `VERIFICATION_MISSING`, `VERIFICATION_REPOSITORY_STALE`, `LEGACY_IDENTITY_UNVERIFIABLE`.

## Framework integrity is not project invalidation
Package-managed framework drift is neither contract invalidation nor acceptance invalidation. It means the execution engine is untrusted. Stop orchestration with the typed framework failure and use installer repair. Do not route framework drift to Planner or Reviewer and do not change ticket lifecycle state to encode it.

## No silent cascade
Every invalidated artifact records why it became stale and which upstream revision/decision caused it. Never delete prior decisions/specs/reviews merely to make current state look clean.
