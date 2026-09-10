# Record review

## Purpose
Persist immutable acceptance history without letting Reviewer write lifecycle state.

## Inputs
Exact handoff; final `PASS`/`REPAIR`/`REPLAN`/`BLOCKED` classification; concrete findings; exact ticket/spec revisions; reviewed repository identity; and exact immutable evidence references used by the review.

## Procedure
1. Create the next immutable `.yaaw/reviews/<SPEC-ID>/<TASK-ID>/R<ROUND>.md` from the review template at the exact handoff-authorized path.
2. Frontmatter records ticket/review round, result, ticket/spec revisions, reviewed repository identity, and exact evidence references.
3. Body records findings, verification, evidence interpretation, and next action rationale.
4. Never overwrite prior review rounds.
5. Return exactly one classification: `PASS`, `REPAIR`, `REPLAN`, or `BLOCKED`.
6. Orchestrator validates the immutable review and persists the corresponding legal ticket transition/provenance.

A prior PASS remains historical but becomes stale when repository/source revisions invalidate its basis.
