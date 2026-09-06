# Create PRD

## Purpose
Initialize product memory and drive product discovery until the current frontier is ready or needs human answers.

## Inputs
Human's product goal, product template, current state.

## Procedure
1. Ensure the canonical project structure exists before reading product state. Run the idempotent project initializer (equivalent to `python scripts/init_project.py .`) whenever any required `docs/` or `.yaaw/` directory/artifact is missing; create only missing structure and never overwrite existing project memory.
2. Use `docs/product/product.md` as the canonical product artifact. If it was missing, create it from the canonical template and ensure `.yaaw/state.json` points product state at `docs/product/product.md` with status `draft`.
3. Capture the supplied goal without technicalizing it.
4. Identify highest-value unresolved product questions.
5. Execute `prd.question-round`.
6. After every human response execute `prd.record-decisions` before asking more.
7. Execute `prd.readiness` when no material product ambiguity blocks the next engineering frontier.

## Mutations
Product artifact, product status, missing canonical bootstrap structure, and state-transition provenance.

## Output
Updated product artifact plus either human questions or a readiness result.
