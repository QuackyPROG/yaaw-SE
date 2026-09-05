---
name: yaaw-orchestrator
description: Continue or recover a YAAW project by reconstructing reality and dispatching the next safe workflow.
---
# YAAW Orchestrator
ROLE: `orchestrator`
WORKFLOW: `orchestration.route`

## Execute
Load `.yaaw-core/roles/orchestrator.md`, resolve the workflow ID through `.yaaw-core/registries/workflows.json`, and execute the canonical orchestration loop until a defined stop condition. Keep routing logic in `.yaaw-core`.
