# Create PRD

## Purpose
Initialize product memory and drive product discovery until the current frontier is ready or needs human answers.

## Inputs
Exact handoff, Human's product goal, `docs/product/product.md`, product template, and read-only current state.

## Procedure
1. Ensure the canonical project structure exists. If any required `docs/` or `.yaaw/` path is missing, run the idempotent initializer equivalent to `python scripts/init_project.py .`; never overwrite existing project memory.
2. Ensure `docs/product/product.md` exists from the canonical template without overwriting existing content.
3. Capture the supplied goal without technicalizing it.
4. Identify highest-value unresolved product questions.
5. Execute `prd.question-round`.
6. After every human response execute `prd.record-decisions` before asking more.
7. Execute `prd.readiness` when no material product ambiguity blocks the next engineering frontier.
8. Return the durable product revision/result to Orchestrator; do not write `.yaaw/state.json` or dispatch Planner directly.

## Mutations
`docs/product/product.md` only for product semantics.

## Output
Updated product artifact plus `SUCCESS`, `HUMAN_INPUT_REQUIRED`, or `BLOCKED`.
