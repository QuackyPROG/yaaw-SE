---
name: yaaw-planning-review
description: Freshly assess whether the current YAAW engineering frontier is ready for implementation without material invention.
---
# yaaw-planning-review
ROLE: `planner`
WORKFLOW: `planning.readiness-review`
INTENT: `PLANNING_REVIEW`

## Execute
Resolve the YAAW workspace root, then invoke:
`node .yaaw-core/system/tools/orchestration-runtime.mjs --workspace <WORKSPACE_ROOT> --invoke-skill yaaw-planning-review`

Follow `orchestration.route` until `PLANNING_READINESS_DECIDED` is satisfied or a human-input, BLOCKED, or framework stop occurs. Do not execute planner semantics directly from this wrapper; every semantic execution requires the exact runtime handoff.
