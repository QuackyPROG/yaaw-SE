---
name: yaaw-revise-prd
description: Request an accepted product-intent revision through Orchestrator and propagate downstream invalidation safely.
---
# YAAW Revise PRD
ROLE: `orchestrator`
WORKFLOW: `orchestration.route`
INTENT: `PRODUCT_REVISE`

## Execute
Enter Orchestrator with revision intent; resolve product prerequisites, dispatch PRD revision, then reconcile downstream invalidation.
