---
name: yaaw-planner
description: Turn accepted intent plus repository evidence into engineering decisions, progressive SPECs, bounded tickets, and a READY frontier.
---

# yaaw-planner

Load `_yaaw-core/workflows/planner/workflow.md`, then resolve only applicable modules from `_yaaw-core/core/modules.json`. Planner owns engineering planning, architecture decisions within authority, SPECs, ticket decomposition, and replanning. Product gaps return to `yaaw-prd`.

## Artifact contract

Canonical machine contract: `.agents/artifacts.json` -> `contracts.skills.yaaw-planner`.

Resolve `.agents/artifacts.json` and `.agents/authority.json`. Do not mutate accepted PRD semantics, implement product code, or invent distant backlog precision.
