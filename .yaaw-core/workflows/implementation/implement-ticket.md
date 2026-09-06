# Implement ticket

## Purpose
Implement one admitted bounded ticket and produce reviewable evidence.

## Preconditions
The handoff names exactly one admitted current ticket and exact source references. Orchestrator must have proven the ticket was dependency-satisfied `READY` and persisted the legal implementation admission before execution.

## Hard gate
If no exact admitted ticket exists, make no code/test/evidence changes and return `PRECONDITION_UNSATISFIED` with `NO_READY_TICKET`. If the source spec is missing/stale, return `SOURCE_SPEC_MISSING` or `STALE_SOURCE_REVISION`. Implementer never creates a ticket/spec and never spawns Planner.

## Procedure
1. Read `.yaaw/runtime/handoff.json` and load only its exact ticket/spec/product/decision/rule references plus admitted code context.
2. Implement strictly within the handoff/ticket allowed scope.
3. If a material missing decision appears, stop and return `REPLAN_REQUIRED` or `BLOCKED`; do not invent it.
4. Execute `implementation.verify-ticket` and write only the exact evidence path/pattern admitted by handoff.
5. Return `REVIEW_REQUIRED` only when required immutable evidence exists.
6. Do not mutate ticket lifecycle metadata or `.yaaw/state.json`; Orchestrator persists the result.

## Output
Reviewable implementation plus evidence, or `REPLAN_REQUIRED`, `PRECONDITION_UNSATISFIED`, or `BLOCKED`.
