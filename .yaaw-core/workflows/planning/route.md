# Planner route

## Purpose
Choose and execute the next canonical planning workflow from durable product/planning/repository state inside one Planner dispatch.

## Inputs
Exact handoff reads: current product, engineering state, referenced ENG/RSH/spec/ticket/rule artifacts, and admitted repository reality.

## Priority
1. missing/stale repository understanding -> `planning.discover` then `planning.write-understanding`;
2. `REPLAN_REQUIRED` -> `planning.replan`;
3. accepted answers not recorded -> `planning.record-decisions`;
4. classify/rebuild the frontier via `planning.decision-frontier`;
5. if an external research gap was created, return `RESEARCH_REQUIRED` to Orchestrator;
6. unresolved human/engineering frontier -> `planning.question-round`;
7. readiness not current -> `planning.readiness-review`;
8. readiness PASS but no current accepted spec -> `planning.create-spec`;
9. accepted spec lacks admitted tickets -> `planning.create-tickets`;
10. otherwise return `SUCCESS`.

## Execution
Do not execute `planning.research` in the same context that discovered the gap. Return through Orchestrator so research runs in fresh Planner context. Never spawn peers.
