# Record review

## Purpose
Persist immutable acceptance history and update current ticket state legally.

## Procedure
1. Create the next immutable `.yaaw/reviews/TASK-NNN-RK.md` from the review template.
2. Frontmatter records ticket/review round, result, ticket/spec revisions, reviewed repository identity, and evidence references.
3. Body records findings, verification, evidence interpretation, and next action.
4. Never overwrite prior review rounds.
5. Apply exactly one legal transition:
   - `PASS` -> ticket `PASS`;
   - `REPAIR` -> `REPAIR_REQUIRED`;
   - `REPLAN` -> `REPLAN_REQUIRED`;
   - `BLOCKED` -> `BLOCKED`.
6. Write state-transition provenance.

A prior PASS remains historical but becomes stale when repository/source revisions invalidate its basis.
