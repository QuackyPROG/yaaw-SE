---
name: yaaw-prd
description: Create or continue YAAW product definition, challenge material product assumptions, and route clarification or revision work.
---
# yaaw-prd
ROLE: `prd`
WORKFLOW: `prd.route`
INTENT: `CONTINUE_PRODUCT`

## Execute
Resolve the YAAW workspace root, then invoke:
`node .yaaw-core/system/tools/orchestration-runtime.mjs --workspace <WORKSPACE_ROOT> --invoke-skill yaaw-prd`

Follow `orchestration.route` until `PRODUCT_READY` is satisfied or a human-input, BLOCKED, or framework stop occurs. Do not execute prd semantics directly from this wrapper; every semantic execution requires the exact runtime handoff.
