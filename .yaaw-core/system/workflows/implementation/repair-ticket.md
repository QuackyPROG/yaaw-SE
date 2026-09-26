# Repair ticket

## Purpose
Correct implementation defects while keeping the accepted ticket/spec contract unchanged.

## Preconditions
Reconciled state is `REPAIR_REQUIRED` and the latest review result is `REPAIR` against the current contract.

## Procedure
1. Load state, the unchanged ticket contract, latest review findings, prior evidence, and relevant code.
2. Repair only the bounded findings; do not broaden scope.
3. If repair requires product/architecture contract changes, return `REPLAN_REQUIRED`.
4. Rerun `implementation.verify-ticket` and write a new v3 verification record distinct from evidence referenced by the REPAIR review.
5. Never edit state. Orchestrator moves `REPAIR_REQUIRED -> REVIEW_REQUIRED` only after fresh PASS verification.

## Output
Repaired reviewable implementation with fresh verification evidence, or a typed replan/blocker result.
