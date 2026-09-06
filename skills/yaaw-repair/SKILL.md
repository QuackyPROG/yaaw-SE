---
name: yaaw-repair
description: Request repair through Orchestrator without bypassing ticket state, review findings, or upstream contract validity.
---
# YAAW Repair
ROLE: `orchestrator`
WORKFLOW: `orchestration.route`
INTENT: `REPAIR`

## Execute
Enter Orchestrator with repair intent; repair runs only for a valid REPAIR_REQUIRED ticket and exact latest review findings.
