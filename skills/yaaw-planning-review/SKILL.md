---
name: yaaw-planning-review
description: Assess whether the current engineering frontier is implementable without material invention.
---
# yaaw-planning-review
ROLE: `planner`
WORKFLOW: `planning.readiness-review`
INTENT: `PLANNING_REVIEW`

Invoke `node .yaaw-core/system/engine/runtime.mjs --workspace <WORKSPACE_ROOT> --invoke-skill yaaw-planning-review` and follow Orchestrator routing until `PLANNING_READINESS_DECIDED`, human input, BLOCKED, or framework stop.
