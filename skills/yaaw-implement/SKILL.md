---
name: yaaw-implement
description: Implement one admitted READY ticket and produce repository-identity-bound verification evidence.
---
# yaaw-implement
ROLE: `implementer`
WORKFLOW: `implementation.implement-ticket`
INTENT: `IMPLEMENT`

Invoke `node .yaaw-core/system/engine/runtime.mjs --workspace <WORKSPACE_ROOT> --invoke-skill yaaw-implement` and follow Orchestrator routing until the selected ticket is `REVIEW_REQUIRED`, BLOCKED, or a framework stop occurs.
