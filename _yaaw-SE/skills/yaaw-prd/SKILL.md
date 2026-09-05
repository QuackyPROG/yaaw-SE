---
name: yaaw-prd
description: Create, continue, refine, revise, or review stakeholder product intent through iterative PRD discovery.
---

# yaaw-prd

## Purpose

Run the stakeholder-facing PRD workflow without performing technical planning.

## Artifact contract

Current v2 draft reuses the existing PRD semantic boundary: the human/stakeholder owns product intent. The clean PRD is the product artifact; `_yaaw-SE/workflows/prd/templates/decision-log.md` defines append-only resumable decision memory.

This source skill is intentionally stored under `_yaaw-SE/skills/` while v2 routing is still being designed. It is not yet installed into `.agents/skills/`, so the v1 active-skill catalog remains valid on this draft branch.

## Activation

1. Resolve project root.
2. Read `_yaaw-SE/workflows/prd/workflow.md`.
3. Resolve an existing PRD/source draft when one is supplied or discoverable from the user's request.
4. Resolve the associated PRD decision log when one exists.
5. Detect CREATE, CONTINUE, REFINE, REVISE, or REVIEW from user intent.
6. Execute the workflow exactly as written.

## Interaction contract

During discovery rounds:

- ask at most five stakeholder questions;
- keep each question direct and normally one line;
- offer short `A/B/C` choices when useful;
- give one concise recommendation;
- accept letter answers, prose, mixed responses, rejection of all choices, or a custom answer;
- never force the user to understand technical architecture in order to make a product decision.

## Completion

Return the PRD path/status and `READY_FOR_PLANNING` only after the workflow readiness gate passes. Do not create a SPEC, implementation plan, ticket, or code change from this skill.
