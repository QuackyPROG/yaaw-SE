---
name: yaaw-create-tickets
description: Create dependency-aware bounded implementation tickets from the current accepted YAAW specification.
---
# yaaw-create-tickets
ROLE: `planner`
WORKFLOW: `planning.create-tickets`
INTENT: `CREATE_TICKETS`

Invoke `node .yaaw-core/system/engine/runtime.mjs --workspace <WORKSPACE_ROOT> --invoke-skill yaaw-create-tickets` and follow Orchestrator routing until `CURRENT_TICKETS_REGISTERED`, BLOCKED, or framework stop.
