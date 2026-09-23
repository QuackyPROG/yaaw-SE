# Routing contract

Routing chooses exactly one next canonical workflow from observed reality. The Orchestrator owns observation, reconciliation, and routing, not product meaning, architecture, implementation, or acceptance.

**Contract invalidation routes to Planner. Acceptance invalidation routes to Reviewer.**

Before dispatch, enforce repository requirements from `registries/execution-policy.json`.

## Priority
1. Resolve material state inconsistency or incomplete recovery.
2. If accepted product intent is missing or invalidated, route to PRD.
3. If a ticket is `REPLAN_REQUIRED`, route to `planning.replan`.
4. If current engineering frontier is unresolved, route through `planning.route`.
5. If a ready frontier lacks an accepted spec, route to `planning.create-spec`.
6. If an accepted spec lacks executable tickets, route to `planning.create-tickets`.
7. If a ticket is `REPAIR_REQUIRED`, route to `implementation.repair-ticket`.
8. If a ticket is `REVIEW_REQUIRED`, route to `review.review-ticket`.
9. If a ticket is `IN_PROGRESS`, use recovery evidence and never restart blindly.
10. If a dependency-satisfied ticket is `READY`, route to `implementation.implement-ticket`.
11. If all current tickets are `PASS` but accepted product scope remains, route to `planning.route`.
12. Declare `COMPLETE` only when accepted scope is covered by current acceptance evidence.

Acceptance-stale `REVIEW_REQUIRED` outranks normal next-ticket work. Repository identity mismatch with current source revisions never directly routes to `planning.replan`.

## Tie breaking
- Never review a `REPAIR_REQUIRED` ticket before repair.
- Never implement a `REPLAN_REQUIRED` ticket.
- Never preserve `PASS` after its acceptance basis becomes stale.
- Never convert repository drift into replan without independent contract invalidation evidence.

The machine-readable cause routes live in `registries/routing-policy.json`.
