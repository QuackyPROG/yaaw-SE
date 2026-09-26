---
name: yaaw-create-spec
description: Create the next YAAW specification from an engineering frontier whose readiness is currently PASS.
---
# yaaw-create-spec
ROLE: `planner`
WORKFLOW: `planning.create-spec`
INTENT: `CREATE_SPEC`

## Execute
Resolve the YAAW workspace root, then invoke:
`node .yaaw-core/system/tools/orchestration-runtime.mjs --workspace <WORKSPACE_ROOT> --invoke-skill yaaw-create-spec`

Follow `orchestration.route` until `CURRENT_SPEC_ACCEPTED` is satisfied or a human-input, BLOCKED, or framework stop occurs. Do not execute planner semantics directly from this wrapper; every semantic execution requires the exact runtime handoff.
