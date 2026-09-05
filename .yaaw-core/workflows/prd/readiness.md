# PRD readiness

## Purpose
Decide whether a fresh Planner can safely begin the next engineering frontier.

## Inputs
Current `product.md` only plus current accepted scope.

## Decision
Ask: can a fresh Planner understand the goal, users, expected behavior, scope, constraints, non-goals, and remaining product unknowns without the original chat?

Return:
- `READY` when intent is sufficient for the next engineering frontier;
- `NEEDS_QUESTIONS` when material product ambiguity remains;
- `BLOCKED` when required human/product evidence is unavailable.

## Mutations
On `READY`, mark product/state ready with current product revision. Do not claim every future requirement is known.
