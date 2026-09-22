# Planner route

## Purpose
Choose and execute the next canonical planning workflow from durable product/planning/repository state.

## Inputs
Current product/engineering metadata, research/spec/ticket metadata, project rules, observed repository capability, current intent, and repository reality needed only for route selection.

## Progressive selection
Do not open candidate planning workflow bodies before one route is selected.

## Priority
1. missing/stale repository understanding -> execute `planning.discover`, then `planning.write-understanding`;
2. missing/stale decision frontier after understanding/decision changes -> `planning.decision-frontier`;
3. `REPLAN_REQUIRED` or invalidated contract -> `planning.replan`;
4. accepted human answers not yet recorded -> `planning.record-decisions`;
5. current frontier has admitted `PENDING` external research -> `planning.research`;
6. unresolved human-owned engineering decisions -> `planning.question-round`;
7. readiness not current -> `planning.readiness-review`;
8. readiness PASS but no current accepted spec -> `planning.create-spec`;
9. accepted spec lacks admitted tickets -> `planning.create-tickets`;
10. otherwise return planning frontier `READY`.

After each selected workflow persists durable output, return to routing before loading another workflow.

## Execution
Resolve and execute selected workflow IDs through `registries/workflows.json`; do not merely report which one would run.
