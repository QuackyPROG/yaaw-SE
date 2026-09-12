# PRD readiness

## Purpose
Decide whether a fresh Planner can safely begin the next engineering frontier.

## Inputs
Current `product.md`, current accepted scope, and `.yaaw-core/rules/assumption-challenge.md`.

## Decision
Ask both:
1. Can a fresh Planner understand the goal, users, expected behavior, scope, constraints, non-goals, and remaining product unknowns without the original chat?
2. Are there any material product assumptions, contradictions, or ambiguous terms in the current engineering frontier that would force a fresh Planner to invent product intent?

Return:
- `READY` when intent is sufficient for the next engineering frontier and the second answer is no;
- `NEEDS_QUESTIONS` when material current-frontier product ambiguity remains;
- `BLOCKED` when required human/product evidence is unavailable.

Future fog is allowed. Readiness does not require every future product question to be solved.

## Mutations
On `READY`, mark product/state ready with current product revision. Do not claim every future requirement is known.
