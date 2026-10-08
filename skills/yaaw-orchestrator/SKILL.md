---
name: yaaw-orchestrator
description: Continue or recover a YAAW project by reconstructing reality and dispatching the next safe workflow.
---
# yaaw-orchestrator
ROLE: `orchestrator`
WORKFLOW: `orchestration.route`
INTENT: `CONTINUE`

Resolve the YAAW workspace root, then invoke:
`node .yaaw-core/system/engine/runtime.mjs --workspace <WORKSPACE_ROOT> --invoke-skill yaaw-orchestrator`

Follow the Orchestrator `route` operation until `CONTINUE_UNTIL_STOP` is satisfied or a human-input, BLOCKED, terminal, or framework stop occurs. Never execute semantic worker authority directly from this wrapper; every worker execution uses the exact fresh runtime handoff.
