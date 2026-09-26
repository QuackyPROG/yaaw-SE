---
name: yaaw-implement
description: Implement one admitted READY YAAW ticket and produce repository-identity-bound verification evidence.
---
# yaaw-implement
ROLE: `implementer`
WORKFLOW: `implementation.implement-ticket`
INTENT: `IMPLEMENT`

## Execute
Resolve the YAAW workspace root, then invoke:
`node .yaaw-core/system/tools/orchestration-runtime.mjs --workspace <WORKSPACE_ROOT> --invoke-skill yaaw-implement`

Follow `orchestration.route` until `TICKET_REVIEW_REQUIRED` is satisfied or a human-input, BLOCKED, or framework stop occurs. Do not execute implementer semantics directly from this wrapper; every semantic execution requires the exact runtime handoff.
