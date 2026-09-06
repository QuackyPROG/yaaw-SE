# Repair ticket

## Purpose
Correct implementation defects while keeping the accepted ticket/spec contract unchanged.

## Preconditions
Ticket is `REPAIR_REQUIRED` and latest review result is `REPAIR` against the same current contract revisions.

## Procedure
1. Load the same ticket contract, `.yaaw-core/rules/changeability.md`, latest review findings, and relevant code/evidence.
2. Repair only what is needed to satisfy the unchanged plan and the concrete review findings; do not broaden scope into adjacent cleanup.
3. Apply the relevant changeability principles when they are part of the defect or needed for a safe repair.
4. If repair requires product/architecture contract changes, transition to `REPLAN_REQUIRED` and stop.
5. Rerun relevant verification, including any previously failed changeability check, and append a new evidence record.
6. Transition `REPAIR_REQUIRED -> REVIEW_REQUIRED` with provenance.

## Output
Repaired reviewable implementation or replan/blocker result.
