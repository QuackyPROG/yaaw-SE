# Routing contract

Routing chooses exactly one next canonical workflow from observed reality. Explicit state and prerequisites beat requested destination. Public skills express desired intent; they never bypass lifecycle prerequisites.

The machine-readable policy lives in `.yaaw-core/registries/routing-policy.json`. CI must fail if it drifts from workflow/skill contracts.

## Public intent rule

Every public skill enters `orchestration.route` and records one `desired_intent` in `.yaaw/runtime/intent.json`. The intent says where the user wants the workflow to head, not which role may run immediately.

Examples:

- `IMPLEMENTATION` with no ticket does not run Implementer.
- `REVIEW` with a `READY` ticket runs implementation before review.
- `SPEC` with unresolved engineering runs planning/readiness before spec creation.

After the requested destination has been validly reached, Orchestrator resumes normal autonomous routing rather than handing control to a peer role.

## Priority

1. Resolve material state inconsistency or incomplete recovery.
2. Honor explicit `PRODUCT_REVISE` / `PRODUCT_REFINE` requests only when a product artifact exists; otherwise product creation comes first.
3. If accepted product intent is missing or newly invalidated, route to PRD.
4. If a ticket is `REPLAN_REQUIRED`, route to `planning.replan`.
5. If current engineering frontier is unresolved, route through `planning.route`.
6. If a ready frontier lacks an accepted spec, route to `planning.create-spec`.
7. If an accepted spec lacks executable tickets, route to `planning.create-tickets`.
8. If a ticket is `REPAIR_REQUIRED`, route to `implementation.repair-ticket`.
9. If a ticket is `REVIEW_REQUIRED`, route to `review.review-ticket`.
10. If a ticket is `IN_PROGRESS`, use recovery evidence to continue safely or reconcile to the next proven boundary; never restart blindly.
11. If a dependency-satisfied ticket is `READY`, route to `implementation.implement-ticket`.
12. If all current tickets are `PASS` but accepted product scope remains, route to `planning.route` for the next frontier.
13. Declare `COMPLETE` only when accepted scope is covered by fresh, non-stale acceptance evidence.

## Hard implementation gate

Implementer may run only for one exact admitted ticket. If no dependency-satisfied `READY` ticket exists, Orchestrator must not dispatch `implementation.implement-ticket`.

For an implementation intent, prerequisites resolve automatically in this order:

```text
product missing/unready
→ PRD
→ engineering unresolved
→ Planner
→ readiness PASS but no spec
→ create spec
→ accepted spec but no executable ticket
→ create tickets
→ admit one READY ticket
→ Implementer
→ Reviewer
→ next ticket/frontier/COMPLETE
```

A missing spec therefore never causes Implementer to invent one, and a missing ticket never causes Implementer to create its own task.

## Tie breaking

- Never review a `REPAIR_REQUIRED` ticket before repair.
- Never implement a `REPLAN_REQUIRED` ticket.
- Never preserve `PASS` after source revision or repository identity invalidates its review.
- When evidence is insufficient to choose safely, route to recovery and ultimately `BLOCKED` rather than guessing.

## Team communication

Roles never dispatch peer roles. A semantic role returns durable output plus a typed result to Orchestrator. Orchestrator validates the result, persists any legal lifecycle transition, reconstructs reality, and chooses the next workflow.

Core rule: **Roles do work. Orchestrator decides work.**
