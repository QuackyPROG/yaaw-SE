---
name: yaaw-repair
description: Repair a YAAW ticket in REPAIR_REQUIRED state while preserving its accepted product and engineering contract.
---
# yaaw-repair
ROLE: `implementer`
WORKFLOW: `implementation.repair-ticket`
INTENT: `REPAIR`

## Execute
Resolve the YAAW workspace root, then invoke:
`node .yaaw-core/system/tools/orchestration-runtime.mjs --workspace <WORKSPACE_ROOT> --invoke-skill yaaw-repair`

Follow `orchestration.route` until `TICKET_REVIEW_REQUIRED` is satisfied or a human-input, BLOCKED, or framework stop occurs. Do not execute implementer semantics directly from this wrapper; every semantic execution requires the exact runtime handoff.
