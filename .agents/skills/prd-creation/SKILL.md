---
name: prd-creation
description: Manual only. Use when the human asks to create, revise, accept, or supersede product intent in a PRD.
---

# PRD Creation

## Invocation

**Manual only.** Invoke this skill when the human explicitly asks to create, revise, or re-baseline a PRD. Orchestrator and Planner may detect and read an existing PRD, but they must never auto-create or silently rewrite one.

A PRD is optional. Do not require one for ordinary L0/L1 work or force one into an L2+ route when the human did not request it.

## Artifact contract

Canonical machine contract: `.agents/artifacts.json` -> `contracts.skills.prd-creation`.

- Read: explicit human product intent, relevant existing PRD if any, accepted business/product constraints, and only the repository context needed to avoid contradicting known reality.
- Produce: `PRD`.
- Canonical destination/template comes from `.agents/artifacts.json`.
- Product-intent authority remains `HUMAN_PRODUCT_AUTHORITY`; the executing Orchestrator is only the mechanical writer for this manually invoked skill.
- Planner, Implementer, QA, Discovery, and Release Engineer may reference PRDs but may not mutate their semantic intent.

## What a PRD owns

Capture the destination, not a fictional implementation route:

1. Problem / opportunity.
2. Users / actors and their relevant needs.
3. Product outcome and value proposition.
4. In-scope behavior and explicit non-goals.
5. Product invariants — truths the resulting product must preserve.
6. User-visible requirements and acceptance signals.
7. Constraints that are genuinely product/business constraints.
8. Success measures when meaningful.
9. Known risks and deliberately unresolved product questions.
10. Explicit human decisions and assumptions, each labeled by status.

## What a PRD must not own

Do not turn the PRD into a frozen engineering backlog. Avoid exact file lists, speculative class hierarchies, fabricated architecture, exhaustive ticket decomposition, implementation ordering, or edge cases that still require engineering discovery.

Those belong to SPEC/ADR/INITIATIVE_MAP and DISCOVERY/DECISION/DELIVERY tickets downstream.

## Status and authority

Create as `DRAFT` unless the human explicitly accepts it as current product intent. Only explicit human authority may set or change `ACCEPTED`, revise accepted product intent, or supersede a PRD.

When implementation discovers a bug, edge case, dependency, feature suggestion, or architectural constraint, record it through the existing ticket/PLAN_DELTA system. Change the PRD only if the discovery actually changes the desired product outcome and the human approves that change.

## Handoff

Return the PRD path, status, product invariants, unresolved product decisions, and a short note telling Orchestrator/Planner that the PRD is an intent source rather than an implementation plan.
