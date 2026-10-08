---
name: yaaw-create-ticket
description: Create bounded implementation tickets from the current accepted YAAW specification.
---
# yaaw-create-ticket
ROLE: `planner`
WORKFLOW: `planning.create-tickets`
INTENT: `CREATE_TICKETS`

Invoke `node .yaaw-core/system/engine/runtime.mjs --workspace <WORKSPACE_ROOT> --invoke-skill yaaw-create-ticket` and follow Orchestrator routing until `CURRENT_TICKETS_REGISTERED`, BLOCKED, or framework stop.
