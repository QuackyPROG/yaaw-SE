---
name: yaaw-create-spec
description: Create the next specification from a ready YAAW engineering frontier.
---
# yaaw-create-spec
ROLE: `planner`
WORKFLOW: `planning.create-spec`
INTENT: `CREATE_SPEC`

Invoke `node .yaaw-core/system/engine/runtime.mjs --workspace <WORKSPACE_ROOT> --invoke-skill yaaw-create-spec` and follow Orchestrator routing until `CURRENT_SPEC_ACCEPTED`, BLOCKED, or framework stop.
