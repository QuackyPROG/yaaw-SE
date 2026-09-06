# Planner route

## Purpose
Choose and execute the next canonical planning workflow from durable product/planning/repository state inside one Planner dispatch.

## Inputs
Exact handoff reads: current `docs/product/product.md`; `docs/engineering/engineering.md`; relevant `docs/engineering/decisions/ENG-*.md`, `docs/specs/<SPEC-ID>.md`, `.yaaw/tickets/<SPEC-ID>/<TASK-ID>.md`, project rules, and admitted repository reality.

## Priority
1. missing/stale repository understanding -> execute `planning.discover`, then `planning.write-understanding`, then re-evaluate;
2. `REPLAN_REQUIRED` or invalidated contract -> `planning.replan`;
3. accepted human answers not yet recorded -> `planning.record-decisions`;
4. unresolved current decision frontier -> `planning.question-round`;
5. readiness not current -> `planning.readiness-review`;
6. readiness PASS but no current accepted spec -> `planning.create-spec`;
7. accepted spec lacks admitted tickets -> `planning.create-tickets`;
8. otherwise return planning frontier `SUCCESS`.

## Execution
Resolve and execute selected planning workflow IDs through `registries/workflows.json` inside the Planner authority boundary. Do not choose or spawn the next peer role; return durable output/result to Orchestrator.
