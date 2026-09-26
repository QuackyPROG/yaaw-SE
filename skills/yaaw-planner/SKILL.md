---
name: yaaw-planner
description: Continue repository-backed YAAW engineering planning, challenge material technical assumptions, and advance decisions, readiness, specifications, or tickets.
---
# yaaw-planner
ROLE: `planner`
WORKFLOW: `planning.route`
INTENT: `CONTINUE_PLANNING`

## Execute
Resolve the YAAW workspace root, then invoke:
`node .yaaw-core/system/tools/orchestration-runtime.mjs --workspace <WORKSPACE_ROOT> --invoke-skill yaaw-planner`

Follow `orchestration.route` until `PLANNING_READY` is satisfied or a human-input, BLOCKED, or framework stop occurs. Do not execute planner semantics directly from this wrapper; every semantic execution requires the exact runtime handoff.
