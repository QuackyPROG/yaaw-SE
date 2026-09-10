# PRD route

## Purpose
Choose and execute the next product-definition workflow from current product state and the human's request.

## Inputs
Exact `.yaaw/runtime/handoff.json`; current `docs/product/product.md` when present; read-only `.yaaw/state.json` only when listed by handoff; and the current human request/answers. Learned project memory is not a PRD semantic input.

## Procedure
1. Classify exactly one route:
   - missing product -> `prd.create`;
   - draft product with unresolved questions -> `prd.question-round`;
   - clarity-only cleanup requested -> `prd.refine`;
   - accepted intent change requested -> `prd.revise`;
   - sufficient current intent -> terminal PRD result `READY`.
2. For a workflow route, resolve the canonical ID through `registries/workflows.json` and execute that same-role workflow under the existing handoff; do not stop after classification and do not broaden I/O.
3. After the workflow writes durable PRD-owned output, re-evaluate product state or return control to Orchestrator.

## Output
Either one executed canonical PRD workflow or `READY` with the current product revision.

## Stop conditions
Stop for human answers when material product ambiguity remains. Never infer engineering implementation choices or learned historical discussion as product intent.
