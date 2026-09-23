# Routing contract

Routing chooses exactly one next canonical workflow from observed reality. Explicit state beats broad heuristics. Workflow selection is metadata-first; target workflow bodies are loaded only after selection.

Before any semantic routing, require framework integrity `HEALTHY` under `.yaaw-core/system/core/framework-integrity.md`. Framework drift is not repository drift and never routes to Planner, Implementer, or Reviewer. It stops execution until installer repair restores the package boundary.

Before dispatch, enforce the selected workflow repository requirement from `.yaaw-core/system/registries/execution-policy.json`. `IDENTITY` workflows require repository status `READY`; `INSPECT` workflows may represent an `UNVERSIONED` workspace; `NONE` workflows do not require Git.

The machine-readable precedence used by conformance tests lives in `.yaaw-core/system/registries/routing-policy.json`. This document explains the same semantics; CI must fail if the machine contract drifts from the workflow registry or lifecycle fixtures.

## Priority
1. Stop on unhealthy/unknown framework integrity or canonical framework-contract inconsistency.
2. Resolve material state inconsistency or incomplete recovery.
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

## Tie breaking
- Never review a `REPAIR_REQUIRED` ticket before repair.
- Never implement a `REPLAN_REQUIRED` ticket.
- Never preserve `PASS` after its acceptance basis becomes stale.
- Never convert repository drift into replan without independent contract invalidation evidence.
- When evidence is insufficient to choose safely, route to recovery and ultimately `BLOCKED` rather than guessing.

## Conformance rule
Behavioral fixtures may reconcile only transitions explicitly justified by durable/repository evidence. They must never make product or architecture decisions. The conformance oracle is test infrastructure, not a second runtime orchestrator.

The Orchestrator selects the workflow; the target role owns semantic work inside it.
