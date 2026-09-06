---
name: yaaw-review
description: Request independent review through Orchestrator; missing implementation prerequisites are completed before review can run.
---
# YAAW Review
ROLE: `orchestrator`
WORKFLOW: `orchestration.route`
INTENT: `REVIEW`

## Execute
Enter Orchestrator with review intent; a ticket must reach REVIEW_REQUIRED with current evidence before Reviewer is dispatched.
