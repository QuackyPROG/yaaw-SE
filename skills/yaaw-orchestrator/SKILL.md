---
name: yaaw-orchestrator
description: Continue or recover a YAAW project by reconstructing reality and dispatching the next safe workflow.
---
# yaaw-orchestrator
ROLE: `orchestrator`
WORKFLOW: `orchestration.route`
INTENT: `CONTINUE`

## Execute
Resolve the YAAW workspace root, then invoke:
`node .yaaw-core/system/tools/orchestration-runtime.mjs --workspace <WORKSPACE_ROOT> --invoke-skill yaaw-orchestrator`

Follow `orchestration.route` until `CONTINUE_UNTIL_STOP` is satisfied or a human-input, BLOCKED, or framework stop occurs. Do not execute orchestrator semantics directly from this wrapper; every semantic execution requires the exact runtime handoff.
