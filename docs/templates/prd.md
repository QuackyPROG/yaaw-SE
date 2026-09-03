---yaaw-json
{
  "schema": "yaaw.prd/v1",
  "id": "PRD-<slug>",
  "status": "DRAFT",
  "semantic_authority": "HUMAN_PRODUCT_AUTHORITY",
  "intent_revision": 1,
  "created": "YYYY-MM-DD",
  "last_intent_revision": "YYYY-MM-DD",
  "supersedes": null,
  "approval_ref": null
}
---
# Product Requirements Document: <Product / Initiative>

## Problem / opportunity

What meaningful problem or opportunity justifies this work?

## Users / actors

Who interacts with the product or is materially affected by it?

## Product outcome

Describe the destination in observable product terms. Avoid prescribing implementation unless it is itself a product constraint.

## In scope

- ...

## Non-goals

- ...

## Product invariants

- ...

## Requirements

### R1 — <requirement>

- Desired behavior:
- Acceptance signal:
- Priority / rationale:

## Constraints

- ...

## Success measures

- ...

## Known risks

- ...

## Open product decisions

Use `OPEN`, `APPROVED`, `REJECTED`, `DEFERRED`, or `UNKNOWN`.

- ...

## Assumptions

- ...

## Change policy

This PRD owns desired product intent, not the engineering route. `ACCEPTED` requires explicit human product authority and an approval reference. Engineering discoveries become tickets and PLAN_DELTA changes unless product intent itself must be revised.
