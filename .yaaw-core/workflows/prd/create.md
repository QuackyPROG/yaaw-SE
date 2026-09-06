# Create PRD

## Purpose
Initialize product memory-of-record and drive product discovery until the current frontier is ready or needs human answers.

## Inputs
Exact handoff, Human's product goal, `docs/product/product.md`, product template, read-only current state, and optional project memory according to the PRD context policy.

## Procedure
1. Ensure the canonical project structure exists. If any required `docs/` or `.yaaw/` path is missing, run the idempotent initializer equivalent to `python scripts/init_project.py .`; never overwrite existing project memory-of-record.
2. Ensure `docs/product/product.md` exists from the canonical template without overwriting existing content.
3. Capture the supplied current goal without technicalizing it.
4. When memory is enabled, search lightly for prior product discussions/initiatives relevant to the goal before asking the human to repeat context. Treat results as historical leads, not accepted product truth.
5. Identify highest-value unresolved product questions from current human input and `product.md`, using memory only to avoid needless repetition or surface previously discussed alternatives.
6. Execute `prd.question-round`.
7. After every human response execute `prd.record-decisions` before asking more.
8. Execute `prd.readiness` when no material product ambiguity blocks the next engineering frontier.
9. Return the durable product revision/result to Orchestrator; do not write `.yaaw/state.json` or dispatch Planner directly.

## Mutations
`docs/product/product.md` only for product semantics.

## Output
Updated product artifact plus `SUCCESS`, `HUMAN_INPUT_REQUIRED`, or `BLOCKED`.
