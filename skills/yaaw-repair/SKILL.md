---
name: yaaw-repair
description: Repair one ticket in REPAIR_REQUIRED while preserving the accepted YAAW contract.
---
# yaaw-repair
ROLE: `implementer`
WORKFLOW: `implementation.repair-ticket`
INTENT: `REPAIR`

Invoke `node .yaaw-core/system/engine/runtime.mjs --workspace <WORKSPACE_ROOT> --invoke-skill yaaw-repair` and follow Orchestrator routing until the selected ticket returns to `REVIEW_REQUIRED`, BLOCKED, or a framework stop occurs.
