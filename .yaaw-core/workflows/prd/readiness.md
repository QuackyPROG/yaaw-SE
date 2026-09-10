# PRD readiness

## Purpose
Decide whether a fresh Planner can safely begin the next engineering frontier.

## Inputs
Exact handoff and current `docs/product/product.md` only, including its current accepted scope, constraints, non-goals, and unresolved product questions. Learned project memory is not a PRD semantic input.

## Decision
Ask: can a fresh Planner understand the goal, users, expected behavior, scope, constraints, non-goals, and remaining product unknowns without the original chat?

Return:
- `READY` when intent is sufficient for the next engineering frontier;
- `NEEDS_QUESTIONS` when material product ambiguity remains;
- `BLOCKED` when required current human/product evidence is unavailable.

## Mutations
On `READY`, update only the PRD-owned product artifact status/revision metadata as needed and return `READY` with the current product revision to Orchestrator. Orchestrator alone persists `.yaaw/state.json`/runtime lifecycle state. Do not claim every future requirement is known.
