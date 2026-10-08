---
name: yaaw-planner
description: Continue repository-backed YAAW engineering planning.
---
# yaaw-planner
ROLE: `planner`
WORKFLOW: `planning.route`
INTENT: `CONTINUE_PLANNING`

Invoke `node .yaaw-core/system/engine/runtime.mjs --workspace <WORKSPACE_ROOT> --invoke-skill yaaw-planner` and follow Orchestrator routing until `PLANNING_READY`, human input, BLOCKED, or framework stop.
