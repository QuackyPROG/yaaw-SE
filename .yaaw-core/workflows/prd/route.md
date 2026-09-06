# PRD route

## Purpose
Choose and execute the next product-definition workflow from current product state and the human's request.

## Inputs
`docs/product/product.md` if present, `.yaaw/state.json`, current request, and relevant accepted product history.

## Procedure
1. Classify exactly one route:
   - missing product -> `prd.create`;
   - draft product with unresolved questions -> `prd.question-round`;
   - clarity-only cleanup requested -> `prd.refine`;
   - accepted intent change requested -> `prd.revise`;
   - sufficient current intent -> terminal PRD result `READY`.
2. For a workflow route, resolve the canonical ID through `registries/workflows.json` and execute it; do not stop after classification.
3. After the workflow writes durable output, re-evaluate product state or return control to Orchestrator.

## Output
Either one executed canonical PRD workflow or `READY` with the current product revision.

## Stop conditions
Stop for human answers when material product ambiguity remains. Never infer engineering implementation choices as product intent.
