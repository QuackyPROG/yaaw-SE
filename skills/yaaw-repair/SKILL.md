---
name: yaaw-repair
description: Repair a YAAW ticket in REPAIR_REQUIRED state while preserving its accepted product and engineering contract.
---
# YAAW Repair
ROLE: `implementer`
WORKFLOW: `implementation.repair-ticket`

## Execute
Load the Implementer role, latest review findings, and canonical repair workflow. Route to replan if satisfying the finding changes the contract.
