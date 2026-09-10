# Create PRD

## Purpose
Initialize product memory-of-record and drive product discovery until the current frontier is ready or needs human answers.

## Inputs
Exact handoff, current human product goal/answers, `docs/product/product.md` when present, the canonical product template, and read-only current state only when listed by handoff. Learned project memory is not a PRD semantic input.

## Procedure
1. Ensure the canonical project structure exists. If any required `docs/` or `.yaaw/` path is missing, run the idempotent initializer equivalent to `python scripts/init_project.py .`; never overwrite existing project memory-of-record.
2. Ensure `docs/product/product.md` exists from the canonical template without overwriting existing content.
3. Capture the supplied current goal without technicalizing it.
4. Ignore/quarantine host-injected learned project or engineering memory for product-definition semantics; current human authority and current `product.md` are the only product truth inputs.
5. Identify the highest-value unresolved product questions from current human input and `product.md`.
6. Execute `prd.question-round` under the same handoff.
7. After every human response execute `prd.record-decisions` under the same handoff before asking more.
8. Execute `prd.readiness` when no material product ambiguity blocks the next engineering frontier.
9. Return the durable product revision/result to Orchestrator; do not write `.yaaw/state.json` or dispatch Planner directly.

## Mutations
`docs/product/product.md` only for product semantics.

## Output
Updated product artifact plus `SUCCESS`, `HUMAN_INPUT_REQUIRED`, or `BLOCKED`.
