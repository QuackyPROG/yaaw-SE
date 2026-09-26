---
name: yaaw-refine-prd
description: Improve clarity and completeness of a YAAW product artifact without changing accepted product meaning.
---
# yaaw-refine-prd
ROLE: `prd`
WORKFLOW: `prd.refine`
INTENT: `REFINE_PRODUCT`

## Execute
Resolve the YAAW workspace root, then invoke:
`node .yaaw-core/system/tools/orchestration-runtime.mjs --workspace <WORKSPACE_ROOT> --invoke-skill yaaw-refine-prd`

Follow `orchestration.route` until `PRODUCT_REFINED` is satisfied or a human-input, BLOCKED, or framework stop occurs. Do not execute prd semantics directly from this wrapper; every semantic execution requires the exact runtime handoff.
