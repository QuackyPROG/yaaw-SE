# Repair ticket

## Purpose
Correct implementation defects while keeping the accepted ticket/spec contract unchanged.

## Preconditions
Handoff names exactly one ticket in `REPAIR_REQUIRED`, its exact current source contract, and the latest immutable review result `REPAIR`.

## Procedure
1. Load only the exact ticket/spec/product/decision references, latest review findings, relevant evidence, and admitted code paths listed by handoff.
2. Repair only what is needed to satisfy the unchanged plan.
3. If repair requires product/architecture contract changes, return `REPLAN_REQUIRED` and stop.
4. Rerun relevant verification and append the next `.yaaw/evidence/<SPEC-ID>/<TASK-ID>-V<VERSION>.json`.
5. Return `REVIEW_REQUIRED` when repair evidence is adequate; Orchestrator persists the legal lifecycle transition.

## Output
Repaired reviewable implementation or `REPLAN_REQUIRED`, `PRECONDITION_UNSATISFIED`, or `BLOCKED`.
