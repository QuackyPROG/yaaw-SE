# Review ticket

## Purpose
Independently determine whether current implementation satisfies the current ticket contract.

## Preconditions
Handoff names exactly one ticket in `REVIEW_REQUIRED` plus exact current source revisions and evidence.

## Procedure
1. Use a fresh review context when practical.
2. Read only the exact workflow artifacts/evidence/prior reviews listed by handoff plus actual repository state for the admitted scope.
3. Execute `review.inspect-change`.
4. Check every acceptance criterion and required test/evidence.
5. Inspect regressions, failure paths, security, UX/accessibility, migration, and compatibility when relevant.
6. Execute `review.classify-findings`.
7. Execute `review.record-review` to write the next immutable canonical review path.
8. Return the classification to Orchestrator; do not mutate ticket lifecycle or dispatch the next role.

## Output
Exactly one result: `PASS`, `REPAIR`, `REPLAN`, or `BLOCKED`.
