# Create PRD

## Purpose
Initialize product memory and drive product discovery until the current frontier is ready or needs human answers.

## Inputs
Human's product goal, product template, current state.

## Procedure
1. If `.yaaw/` is absent, initialize the canonical durable layout and starting artifacts (equivalent to `python scripts/init_project.py .`); never overwrite existing project memory.
2. If `product.md` is absent inside an existing `.yaaw/`, create it from the canonical template and set product state to `draft`.
3. Capture the supplied goal without technicalizing it.
4. Identify highest-value unresolved product questions.
5. Execute `prd.question-round`.
6. After every human response execute `prd.record-decisions` before asking more.
7. Execute `prd.readiness` when no material product ambiguity blocks the next engineering frontier.

## Mutations
Product artifact, product status, bootstrap state when required, and state-transition provenance.

## Output
Updated product artifact plus either human questions or a readiness result.
