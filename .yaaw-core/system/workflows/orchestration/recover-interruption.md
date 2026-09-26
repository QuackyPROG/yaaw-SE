# Recover interruption

## Purpose
Resume safely after context/session failure without duplicating already-completed work.

## Inputs
Reconciled state, durable artifacts, implementation-start/verification evidence, reviews, and repository identity.

## Procedure
1. Discard stale runtime caches/handoffs.
2. Identify the last trustworthy durable boundary.
3. For `IN_PROGRESS`: current PASS verification is reconciled to review; valid start evidence without PASS verification routes to `implementation.verify-ticket`; missing start evidence requires explicit recovery/blocking proof.
4. Never rerun full implementation merely because a worker response disappeared.
5. A source-current review artifact is adopted before another Reviewer dispatch.
6. Use only legal transitions with provenance; if the boundary cannot be proven, return `BLOCKED`.

## Output
A safe next boundary or exact blocker, then control returns to `orchestration.route`.
