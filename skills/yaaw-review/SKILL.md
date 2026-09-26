---
name: yaaw-review
description: Independently review actual YAAW implementation and classify PASS, REPAIR, REPLAN, or BLOCKED against current evidence.
---
# yaaw-review
ROLE: `reviewer`
WORKFLOW: `review.review-ticket`
INTENT: `REVIEW`

## Execute
Resolve the YAAW workspace root, then invoke:
`node .yaaw-core/system/tools/orchestration-runtime.mjs --workspace <WORKSPACE_ROOT> --invoke-skill yaaw-review`

Follow `orchestration.route` until `TICKET_REVIEW_APPLIED` is satisfied or a human-input, BLOCKED, or framework stop occurs. Do not execute reviewer semantics directly from this wrapper; every semantic execution requires the exact runtime handoff.
