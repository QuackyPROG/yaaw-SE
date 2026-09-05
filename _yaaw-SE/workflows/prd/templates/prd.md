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

<Why this product or capability should exist.>

## Users / actors

<Who uses it or is materially affected.>

## Product outcome

<The desired destination in plain, observable product terms.>

## Core flows

### <Flow 1>

- Trigger:
- Expected behavior:
- Completion signal:
- Important failure/recovery behavior:

## Roles and permissions

- <Role>: <what this role may do>

## In scope

- ...

## Non-goals

- ...

## Requirements

### R1 — <requirement>

- Desired behavior:
- Acceptance signal:
- Product rationale / priority:

## Lifecycle and recovery

Capture product behavior only where it materially matters:

- create:
- change:
- disable/suspend/expire:
- transfer:
- delete:
- restore/recover:

Remove irrelevant rows rather than filling them with ceremony.

## Security, privacy, and destructive behavior

Record stakeholder-visible/product-level rules, for example who may access/export/delete data, whether sensitive actions are recoverable, whether reusable links/codes are allowed, or what happens after account recovery.

Do not prescribe technical implementation here.

- ...

## Product invariants

- ...

## Constraints

Only genuine product/business/legal/operational constraints that affect the desired product.

- ...

## Success measures

- ...

## Deferred / rejected ideas

Keep useful discovery outcomes without accidentally making them current scope.

- ...

## Open product decisions

Only material stakeholder decisions that remain unresolved. Non-blocking items may remain when the PRD is ready for planning.

- ...

## Assumptions

- ...

## Change policy

This PRD owns stakeholder/product intent, not the engineering route. Product suggestions are not scope until explicitly accepted. Feature additions/removals/changes require dependent-behavior rediscovery before the resulting PRD is treated as coherent. Accepted semantic revisions require explicit human product authority.
