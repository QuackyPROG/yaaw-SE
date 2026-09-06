# Review ticket

## Purpose
Independently determine whether current implementation satisfies the current ticket contract.

## Preconditions
Ticket is `REVIEW_REQUIRED`; source revisions and evidence are current enough to review.

## Procedure
1. Use a fresh review context when practical.
2. Execute `review.inspect-change`.
3. Check every acceptance criterion and required test/evidence.
4. Inspect regressions, failure paths, security, UX/accessibility, migration, and compatibility when relevant.
5. Apply `.yaaw-core/rules/changeability.md` to the changed surface. Assess only materially relevant principles and distinguish concrete engineering defects from style preferences.
6. For any blocking changeability finding, record the principle, concrete location/evidence, expected property, actual implementation, engineering impact, and bounded repair/replan action.
7. Execute `review.classify-findings`.
8. Execute `review.record-review`.

## Output
Exactly one result: `PASS`, `REPAIR`, `REPLAN`, or `BLOCKED`. Style preference alone cannot produce a failing result.
