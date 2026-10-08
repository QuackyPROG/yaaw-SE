---
name: yaaw-refine-prd
description: Improve product clarity without changing accepted meaning.
---
# yaaw-refine-prd
ROLE: `prd`
WORKFLOW: `prd.refine`
INTENT: `REFINE_PRODUCT`

Invoke `node .yaaw-core/system/engine/runtime.mjs --workspace <WORKSPACE_ROOT> --invoke-skill yaaw-refine-prd` and follow Orchestrator routing until `PRODUCT_REFINED`, human input, BLOCKED, or framework stop.
