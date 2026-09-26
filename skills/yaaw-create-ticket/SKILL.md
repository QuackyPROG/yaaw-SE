---
name: yaaw-create-ticket
description: Create bounded YAAW implementation ticket contracts from the current accepted specification.
---
# yaaw-create-ticket
ROLE: `planner`
WORKFLOW: `planning.create-tickets`
INTENT: `CREATE_TICKETS`

## Execute
Resolve the YAAW workspace root, then invoke:
`node .yaaw-core/system/tools/orchestration-runtime.mjs --workspace <WORKSPACE_ROOT> --invoke-skill yaaw-create-ticket`

Follow `orchestration.route` until `CURRENT_TICKETS_REGISTERED` is satisfied or a human-input, BLOCKED, or framework stop occurs. Do not execute planner semantics directly from this wrapper; every semantic execution requires the exact runtime handoff.
