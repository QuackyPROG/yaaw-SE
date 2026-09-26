---
name: yaaw-revise-prd
description: Change accepted YAAW product intent and invalidate downstream engineering contracts whose basis became stale.
---
# yaaw-revise-prd
ROLE: `prd`
WORKFLOW: `prd.revise`
INTENT: `REVISE_PRODUCT`

## Execute
Resolve the YAAW workspace root, then invoke:
`node .yaaw-core/system/tools/orchestration-runtime.mjs --workspace <WORKSPACE_ROOT> --invoke-skill yaaw-revise-prd`

Follow `orchestration.route` until `PRODUCT_REVISION_ADVANCED` is satisfied or a human-input, BLOCKED, or framework stop occurs. Do not execute prd semantics directly from this wrapper; every semantic execution requires the exact runtime handoff.
