# Implement ticket

## Purpose
Implement one admitted bounded ticket and produce reviewable evidence without re-learning unrelated project history.

## Inputs
Exact `.yaaw/runtime/handoff.json`; exactly one admitted current `.yaaw/tickets/<SPEC-ID>/<TASK-ID>.md`; its exact current source spec/product/engineering-decision/rule references; selected expertise; and only repository/application/evidence paths admitted by the handoff. Optional learned memory is allowed only according to the Implementer `context_policy` after authoritative inputs are understood.

## Preconditions
The handoff names exactly one admitted current ticket and exact source references. Orchestrator must have proven the ticket was dependency-satisfied `READY` and persisted the legal implementation admission before execution.

## Hard gate
If no exact admitted ticket exists, make no code/test/evidence changes and return `PRECONDITION_UNSATISFIED` with reason `NO_READY_TICKET`. If the source spec is missing/stale, make no implementation changes and return `PRECONDITION_UNSATISFIED` with reason `SOURCE_SPEC_MISSING` or `STALE_SOURCE_REVISION`. Implementer never creates a ticket/spec and never spawns Planner.

## Procedure
1. Read `.yaaw/runtime/handoff.json` first and load only its exact ticket/spec/product/decision/rule references plus admitted code context.
2. Understand the authoritative ticket/spec contract before consulting project memory.
3. When the handoff context policy enables memory, search task-relevant project knowledge before broad code archaeology. Use it to surface component conventions, historical rationale, prior fixes, recurring defects, known traps, historical test failures, and exact past values; read/deep-reflect only when shallow results are insufficient and policy allows it.
4. Verify any remembered claim that will affect an edit against current admitted code/repository reality. Ignore stale or irrelevant memory. Memory may explain a contract but never change scope, acceptance criteria, architecture, or required behavior.
5. Implement strictly within the handoff/ticket allowed scope.
6. If learned memory suggests a broader architecture change or a material missing decision appears, stop and return `REPLAN_REQUIRED` or `BLOCKED`; do not expand scope, invent the decision, or use memory as a substitute for a current Planner-owned decision.
7. Execute `implementation.verify-ticket` under the same handoff and write only the exact evidence path/pattern admitted by handoff.
8. Return `REVIEW_REQUIRED` only when required immutable evidence exists.
9. Do not mutate ticket lifecycle metadata or `.yaaw/state.json`; Orchestrator persists the result.

## Output
Reviewable implementation plus evidence, or `REPLAN_REQUIRED`, `PRECONDITION_UNSATISFIED`, or `BLOCKED`.
