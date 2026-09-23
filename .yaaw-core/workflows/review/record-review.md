# Record review

## Purpose
Persist immutable Reviewer-owned acceptance history and return the authorized lifecycle outcome to Orchestrator without writing the state ledger directly.

## Procedure
1. Create the next immutable `.yaaw-core/project/reviews/TASK-NNN-RK.md` from the review template.
2. Frontmatter records ticket/review round, result, ticket/spec revisions, reviewed repository identity, and evidence references.
3. Body records findings, verification, evidence interpretation, and next action.
4. Never overwrite prior review rounds.
5. Select exactly one legal semantic outcome:
   - `PASS` authorizes target ticket state `PASS`;
   - `REPAIR` authorizes `REPAIR_REQUIRED`;
   - `REPLAN` authorizes `REPLAN_REQUIRED`;
   - `BLOCKED` authorizes `BLOCKED`.
6. Reviewer writes only the immutable review artifact and returns the typed result. Reviewer does not edit `.yaaw-core/project/state.json`.
7. Orchestrator re-inspects the new review, validates source/repository/evidence freshness, and records exactly the authorized transition plus provenance in `state.json`. Orchestrator may not substitute a different acceptance outcome.

A prior PASS remains historical but becomes stale when repository/source revisions invalidate its basis.

## Review identity

New review rounds use `yaaw.review/v2` and bind the canonical `yaaw-worktree-v1` repository identity. Never rewrite old `yaaw.review/v1` rounds.
