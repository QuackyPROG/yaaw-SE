---
name: yaaw-review
description: Independently review implementation and classify PASS, REPAIR, REPLAN, or BLOCKED.
---
# yaaw-review
ROLE: `reviewer`
WORKFLOW: `review.review-ticket`
INTENT: `REVIEW`

Invoke `node .yaaw-core/system/engine/runtime.mjs --workspace <WORKSPACE_ROOT> --invoke-skill yaaw-review` and follow Orchestrator routing until the selected review result is applied, BLOCKED, or a framework stop occurs.
