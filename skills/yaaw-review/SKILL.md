---
name: yaaw-review
description: Independently review actual YAAW implementation and classify PASS, REPAIR, REPLAN, or BLOCKED against current evidence.
---
# YAAW Review
ROLE: `reviewer`
WORKFLOW: `review.review-ticket`

## Execute
Load `.yaaw-core/system/roles/reviewer.md`, resolve `review.review-ticket` through `.yaaw-core/system/registries/workflows.json`, then execute that canonical workflow. Keep semantic behavior in `.yaaw-core/system/`; this skill is only an entrypoint.
