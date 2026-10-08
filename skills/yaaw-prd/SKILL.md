---
name: yaaw-prd
description: Create or continue YAAW product definition and route clarification or revision work.
---
# yaaw-prd
ROLE: `prd`
WORKFLOW: `prd.route`
INTENT: `CONTINUE_PRODUCT`

Invoke `node .yaaw-core/system/engine/runtime.mjs --workspace <WORKSPACE_ROOT> --invoke-skill yaaw-prd` and follow Orchestrator routing until `PRODUCT_READY`, human input, BLOCKED, or framework stop.
