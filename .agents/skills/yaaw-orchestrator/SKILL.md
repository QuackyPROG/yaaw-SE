---
name: yaaw-orchestrator
description: Normal yaaw-SE entry point. Observe controller/frontier state and route Planner, Implement, Review, or terminal delivery.
---

# yaaw-orchestrator

Load `_yaaw-core/workflows/orchestrator/workflow.md`, `.agents/router.json`, and only the minimum current durable state. Use deterministic controller admission/frontier rather than inventing executable order. Dispatch registered roles/skills only; children never recursively orchestrate.

## Artifact contract

Canonical machine contract: `.agents/artifacts.json` -> `contracts.skills.yaaw-orchestrator`.

Resolve `.agents/artifacts.json` and `.agents/authority.json`; workflow coordination grants no Planner/Implement/Review semantic authority.
