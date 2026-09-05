# Create PRD

## Purpose
Initialize product memory and drive product discovery until the current frontier is ready or needs human answers.

## Inputs
Human's product goal, product template, current state.

## Procedure
1. If absent, create `.yaaw/product.md` from the canonical template and set product state to `draft`.
2. Capture the supplied goal without technicalizing it.
3. Identify highest-value unresolved product questions.
4. Execute `prd.question-round`.
5. After every human response execute `prd.record-decisions` before asking more.
6. Execute `prd.readiness` when no material product ambiguity blocks the next engineering frontier.

## Mutations
Product artifact, product status, and state-transition provenance.

## Output
Updated product artifact plus either human questions or a readiness result.
