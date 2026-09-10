# Repair ticket

## Purpose
Correct implementation defects while keeping the accepted ticket/spec contract unchanged and avoiding repeated bug archaeology.

## Inputs
Exact handoff; exactly one ticket in `REPAIR_REQUIRED`; its exact current spec/product/decision/rule references; latest immutable `REPAIR` review findings; relevant existing evidence; selected expertise; and only admitted repository/application paths. Optional learned memory is allowed only according to the Implementer `context_policy` after authoritative inputs are understood.

## Preconditions
Handoff names exactly one ticket in `REPAIR_REQUIRED`, its exact current source contract, and the latest immutable review result `REPAIR`.

## Procedure
1. Load only the exact ticket/spec/product/decision references, latest review findings, relevant evidence, and admitted code paths listed by handoff.
2. When memory is enabled, search narrowly for previous fixes, component traps, or historical rationale relevant to the concrete review finding before broad repository exploration. Verify material claims against current code.
3. Repair only what is needed to satisfy the unchanged current plan. Memory cannot redefine the repair target.
4. If repair requires product/architecture contract changes, return `REPLAN_REQUIRED` and stop; do not alter Planner-owned contracts.
5. Rerun relevant verification and append the next `.yaaw/evidence/<SPEC-ID>/<TASK-ID>-V<VERSION>.json` at the handoff-authorized path.
6. Return `REVIEW_REQUIRED` when repair evidence is adequate; Orchestrator persists the legal lifecycle transition.

## Output
Repaired reviewable implementation or `REPLAN_REQUIRED`, `PRECONDITION_UNSATISFIED`, or `BLOCKED`.
