# Routing contract

Routing chooses exactly one next canonical workflow from observed reality. Explicit state beats broad heuristics. Workflow selection is metadata-first; target workflow bodies are loaded only after selection.

The machine implementation of this precedence is `.yaaw-core/system/tools/orchestration-runtime.mjs`, driven by `.yaaw-core/system/registries/routing-policy.json`. Orchestrator consumes the tool's typed route instead of manually replaying the precedence with shell commands or model reasoning.

Before any semantic routing, require framework integrity `HEALTHY` under `.yaaw-core/system/core/framework-integrity.md`. Framework drift is not repository drift and never routes to Planner, Implementer, or Reviewer. It stops execution until installer repair restores the package boundary.

Before dispatch, enforce the selected workflow repository requirement from `.yaaw-core/system/registries/execution-policy.json`. `IDENTITY` workflows require repository status `READY`; `INSPECT` workflows may represent an `UNVERSIONED` workspace; `NONE` workflows do not require Git.

## Priority
1. Stop on unhealthy/unknown framework integrity or canonical framework-contract inconsistency.
2. Resolve material state inconsistency or incomplete recovery before creating a semantic handoff.
3. If accepted product intent is missing or newly invalidated, route to PRD.
4. If a ticket is `REPLAN_REQUIRED`, route to `planning.replan`.
5. If current engineering frontier is unresolved, route through `planning.route`.
6. If a ready frontier lacks an accepted spec, route to `planning.create-spec`.
7. If an accepted spec lacks executable tickets, route to `planning.create-tickets`.
8. If a ticket is `REPAIR_REQUIRED`, route to `implementation.repair-ticket`.
9. If a ticket is `REVIEW_REQUIRED`, route to `review.review-ticket`.
10. If a ticket is `IN_PROGRESS`, use recovery evidence to continue safely or reconcile to the next proven boundary; never restart blindly.
11. If a dependency-satisfied ticket is `READY`, route to `implementation.implement-ticket`.
12. If all current tickets are `PASS`/`CANCELLED` but accepted product scope remains, route to `planning.route` for the next frontier.
13. Declare `COMPLETE` only when the durable phase is complete and accepted scope is covered by fresh, non-stale acceptance evidence.

## Tie breaking
- Never review a `REPAIR_REQUIRED` ticket before repair.
- Never implement a `REPLAN_REQUIRED` ticket.
- Never preserve `PASS` after its acceptance basis becomes stale.
- Never convert repository drift into replan without independent contract invalidation evidence.
- When evidence is insufficient to choose safely, route to recovery and ultimately `BLOCKED` rather than guessing.

## Conformance rule
Behavioral fixtures and the deterministic runtime may reconcile/route only transitions explicitly justified by durable/repository evidence. They must never make product or architecture decisions.

The Orchestrator selects/consumes the route; the target role owns semantic work inside it.
