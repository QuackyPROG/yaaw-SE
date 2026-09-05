---
name: yaaw-orchestrator
description: Normal yaaw-SE entry point. Observe controller/frontier state and route Planner, Implement, Review, or terminal delivery.
---

# yaaw-orchestrator

Load `_yaaw-core/workflows/orchestrator/workflow.md`, `.agents/router.json`, and only the minimum current durable state. Use deterministic controller admission/frontier rather than inventing executable order. Dispatch only registered public skills.

When a route requires freshness or bounded parallel evidence, start a generic execution context carrying the selected skill plus the minimum `yaaw.handoff/v1` contract. Do not depend on named role profiles; `.agents/agents/` and `.codex/agents/` are intentionally absent. Workflow coordination never recurses.

## Artifact contract

Canonical machine contract: `.agents/artifacts.json` -> `contracts.skills.yaaw-orchestrator`.

Resolve `.agents/artifacts.json` and `.agents/authority.json`; workflow coordination grants no Planner/Implement/Review semantic authority.
