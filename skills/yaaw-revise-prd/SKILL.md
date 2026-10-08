---
name: yaaw-revise-prd
description: Change accepted YAAW product intent and invalidate stale downstream contracts.
---
# yaaw-revise-prd
ROLE: `prd`
WORKFLOW: `prd.revise`
INTENT: `REVISE_PRODUCT`

Invoke `node .yaaw-core/system/engine/runtime.mjs --workspace <WORKSPACE_ROOT> --invoke-skill yaaw-revise-prd` and follow Orchestrator routing until `PRODUCT_REVISION_ADVANCED`, human input, BLOCKED, or framework stop.
