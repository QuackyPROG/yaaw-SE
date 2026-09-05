# Repair ticket

## Purpose
Correct implementation defects while keeping the accepted ticket/spec contract unchanged.

## Preconditions
Ticket is `REPAIR_REQUIRED` and latest review result is `REPAIR` against the same current contract revisions.

## Procedure
1. Load the same ticket contract plus latest review findings and relevant code/evidence.
2. Repair only what is needed to satisfy the unchanged plan.
3. If repair requires product/architecture contract changes, transition to `REPLAN_REQUIRED` and stop.
4. Rerun relevant verification and append a new evidence record.
5. Transition `REPAIR_REQUIRED -> REVIEW_REQUIRED` with provenance.

## Output
Repaired reviewable implementation or replan/blocker result.
