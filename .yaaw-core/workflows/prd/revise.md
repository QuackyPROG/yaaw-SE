# Revise PRD

## Purpose
Change already accepted product intent while preserving history and invalidating stale downstream trust.

## Inputs
Current accepted product revision, explicit human-requested change, and `.yaaw-core/rules/assumption-challenge.md`.

## Procedure
1. Identify the exact old requirement and requested new intent.
2. Apply the assumption-challenge rule to the requested intent: test impact on accepted behavior, scope/non-goals, constraints, contradictions, and newly exposed product questions.
3. Resolve only product-semantic issues under PRD/human authority; do not convert the revision into engineering design.
4. Update `product.md`, increment product revision, and record the change/provenance.
5. Execute `core/invalidation.md` against dependent engineering decisions, specs, tickets, and reviews.
6. Mark product `draft` if new material current-frontier questions remain; otherwise run `prd.readiness`.

## Boundary
Assumption challenging does not bypass explicit revision semantics. Do not rewrite engineering decisions yourself; invalidate their basis and return ownership to Planner.
