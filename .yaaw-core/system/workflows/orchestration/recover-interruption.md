# Recover interruption

## Purpose
Resume safely after an actual context/session failure without duplicating already-completed work.

This workflow is interruption-specific. It is not the generic fallback for an unresolved lifecycle state, a `DRAFT` ticket, missing planning admission, or a shortcut precondition failure.

## Inputs
Reconciled state, durable artifacts, implementation-start/verification evidence, reviews, and repository identity.

## Selection guard
Select `orchestration.recover-interruption` only when durable evidence indicates an interrupted execution boundary that cannot yet be classified by the ordinary semantic routes. The normal example is `IN_PROGRESS` with missing implementation-start provenance after a worker/session loss.

Do not select recovery merely because no Implementer handoff is currently available.

## Procedure
1. Discard stale runtime caches/handoffs.
2. Identify the last trustworthy durable boundary.
3. For `IN_PROGRESS`: current PASS verification is reconciled to review; valid start evidence without PASS verification routes to `implementation.verify-ticket`; missing start evidence requires explicit recovery/blocking proof.
4. Never rerun full implementation merely because a worker response disappeared.
5. A source-current review artifact is adopted before another Reviewer dispatch.
6. Use only legal transitions with provenance; if the interruption boundary cannot be proven, return an exact typed blocker rather than repeatedly selecting recovery.
7. If inspection proves there is no interrupted execution boundary, return immediately to `orchestration.route`. Do not remain parked in recovery.

## Explicit non-cases
- registered `DRAFT` ticket with current planning/spec sources -> Planner admission;
- `DRAFT` whose prerequisite ticket is runnable -> continue the prerequisite;
- all accepted work PASS/CANCELLED with scope OPEN/UNKNOWN -> Planner next frontier;
- direct Review/Repair shortcut with unsatisfied lifecycle preconditions -> typed shortcut precondition failure.

## Output
A safe next boundary or exact interruption blocker, then control returns to `orchestration.route`.
