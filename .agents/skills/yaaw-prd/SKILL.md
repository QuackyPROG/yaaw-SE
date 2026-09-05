---
name: yaaw-prd
description: Define or refine stakeholder product intent through iterative concise discovery. Manual product-authority workflow.
---

# yaaw-prd

Load `_yaaw-core/workflows/prd/workflow.md`. Ask only stakeholder-facing product questions, at most five per round, using one-line A/B/C + Recommended formatting. Record accepted decisions, minimally update the PRD, then rediscover the full updated PRD until materially ready for planning.

## Artifact contract

Canonical machine contract: `.agents/artifacts.json` -> `contracts.skills.yaaw-prd`.

Resolve `.agents/artifacts.json` and `.agents/authority.json` before durable output. PRD semantic authority remains `HUMAN_PRODUCT_AUTHORITY`.
