# Planner route

## Purpose
Choose and execute the next canonical planning workflow from durable product/planning/repository state.

## Inputs
Current `product.md`, `engineering.md` if present, `.yaaw/state.json`, relevant specs/tickets, project rules, and repository reality.

## Priority
1. missing/stale repository understanding -> execute `planning.discover`, then `planning.write-understanding`, then re-evaluate;
2. `REPLAN_REQUIRED` or invalidated contract -> `planning.replan`;
3. accepted human answers not yet recorded -> `planning.record-decisions`;
4. unresolved current decision frontier -> `planning.question-round`;
5. readiness not current -> `planning.readiness-review`;
6. readiness PASS but no current accepted spec -> `planning.create-spec`;
7. accepted spec lacks admitted tickets -> `planning.create-tickets`;
8. otherwise return planning frontier `READY`.

## Execution
Resolve and execute selected workflow IDs through `registries/workflows.json`; do not merely report which one would run.
