# Reconcile state

## Purpose
Repair only evidence-backed state inconsistencies before routing semantic work.

## Inputs
Current observed-state snapshot, state claims, artifact revisions, repository/evidence/review identity.

## Procedure
- apply `core/recovery.md`, `core/transitions.md`, and `core/invalidation.md`;
- examples: `IN_PROGRESS` + implementation + passing verification + no review -> `REVIEW_REQUIRED`; stale `PASS` -> `REPLAN_REQUIRED` or `REVIEW_REQUIRED` according to cause; `READY` + implementation already present -> recover/inspect rather than duplicate;
- never change product/architecture meaning during reconciliation;
- every repaired state records transition reason/evidence and increments transition sequence.

## Output
Reconciled state or `BLOCKED` when the last trustworthy boundary cannot be proven.
