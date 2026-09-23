# Review ticket

## Purpose
Independently determine whether current implementation satisfies the current ticket contract.

## Preconditions
`.yaaw-core/project/state.json` is admitted read-only context. Its `tickets[TASK-NNN]` lifecycle value is authoritative for workflow admission and is `REVIEW_REQUIRED`, unless Orchestrator explicitly admitted a source-current stale-`PASS` acceptance revalidation.

Ticket frontmatter `status` is artifact metadata/admission history and may still say `READY` or another earlier value after later lifecycle transitions. It does not override the reconciled state ledger. Source revisions and evidence must still be current enough to review.

If state and stronger source/repository/evidence reality materially conflict, return `BLOCKED` with the exact conflict for Orchestrator reconciliation. Do not edit state.

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

## Acceptance revalidation

Previously `PASS` but acceptance-stale tickets are valid review inputs. Compare current source revisions, canonical repository identity, and required verification. Reviewer may return `PASS`, `REPAIR`, `REPLAN`, or `BLOCKED`. Changeability rules remain mandatory.
