# Invalidation propagation

Accepted artifacts are historical records, not eternally valid truth. When an upstream basis changes, preserve history and invalidate downstream trust explicitly without crossing role ownership boundaries.

## Ownership invariant

Triggering roles never mutate another role's semantic artifacts merely because they detected invalidity. They update only artifacts they own, return durable invalidation provenance to Orchestrator, and let Orchestrator coordinate the proper owner/workflow.

- PRD records the new product revision and changed requirement/provenance only.
- Planner applies semantic invalidation to Planner-owned engineering decisions, engineering readiness, specs, rules, and ticket contract meaning when replanning requires it.
- Orchestrator persists ticket lifecycle invalidation and `.yaaw/state.json` / runtime provenance using legal transitions.
- Reviewer/Implementer may report `REPLAN` / `REPLAN_REQUIRED` evidence but do not rewrite Planner-owned contracts or lifecycle state.
- Prior reviews/evidence remain immutable historical records; they are not rewritten to simulate current validity.

## Product revision change
1. PRD increments `docs/product/product.md` revision and records the changed requirement/provenance.
2. PRD returns `invalidation_required` to Orchestrator; it does not inspect or mutate downstream semantic artifacts outside its handoff/read authority.
3. Orchestrator routes Planner with the new product revision and existing downstream references/evidence needed to determine impact.
4. Planner identifies affected `ENG-*` decisions, marks superseded/invalidated Planner-owned semantics explicitly, moves planning readiness to unresolved when required, and marks dependent specs `STALE` rather than silently rewriting history.
5. Planner returns the exact affected ticket IDs and required lifecycle disposition to Orchestrator.
6. Orchestrator persists affected ticket lifecycle transitions (including prior `PASS` tickets when behavior is affected) to `REPLAN_REQUIRED` using `registries/transitions.json`, and records transition provenance in `.yaaw/state.json`.
7. Prior reviews remain immutable historical evidence but no longer establish current acceptance once their source basis is stale.

## Engineering decision change
Apply the same owner-coordinated propagation from Planner-owned affected `ENG-*` decisions -> specs/ticket contract meaning, then return ticket lifecycle changes to Orchestrator for persistence.

## Repository drift
A review becomes stale when the reviewed repository identity no longer matches the relevant implementation state. Orchestrator routes to review if the contract remains valid; route to Planner/replan when current evidence indicates the contract itself may be invalid. Memory is never proof of drift or validity.

## No silent cascade
Every invalidated semantic artifact records why it became stale and which upstream revision/decision caused it. Every lifecycle invalidation records transition provenance. Never delete prior decisions/specs/reviews/evidence merely to make current state look clean.
