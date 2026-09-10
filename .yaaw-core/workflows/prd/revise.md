# Revise PRD

## Purpose
Change already accepted product intent while preserving history and causing stale downstream trust to be invalidated by the proper owners.

## Inputs
Exact handoff, current accepted `docs/product/product.md` revision, and the explicit current human-requested change. Learned project memory is not a PRD semantic input.

## Procedure
1. Identify the exact old requirement and requested new intent.
2. Determine product-level implications and newly visible questions.
3. Update `product.md`, increment product revision, and record the change/provenance.
4. Return `invalidation_required` with the changed product revision and requirement/provenance to Orchestrator. Do not mutate engineering decisions, specs, ticket lifecycle, reviews, evidence, runtime state, or application files.
5. Mark the PRD-owned product artifact `draft` if new material questions remain; otherwise run `prd.readiness` under the same handoff.

## Output
Updated product revision/status plus `SUCCESS`, `HUMAN_INPUT_REQUIRED`, or `BLOCKED`, including `invalidation_required` when downstream trust must be reconsidered.

## Boundary
Do not rewrite engineering decisions yourself. Orchestrator coordinates downstream invalidation and routes Planner-owned semantic changes back to Planner.
