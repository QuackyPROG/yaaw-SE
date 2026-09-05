# Revise PRD

## Purpose
Change already accepted product intent while preserving history and invalidating stale downstream trust.

## Inputs
Current accepted product revision and explicit human-requested change.

## Procedure
1. Identify the exact old requirement and requested new intent.
2. Determine product-level implications and newly visible questions.
3. Update `product.md`, increment product revision, and record the change/provenance.
4. Execute `core/invalidation.md` against dependent engineering decisions, specs, tickets, and reviews.
5. Mark product `draft` if new material questions remain; otherwise run `prd.readiness`.

## Boundary
Do not rewrite engineering decisions yourself; invalidate their basis and return ownership to Planner.
