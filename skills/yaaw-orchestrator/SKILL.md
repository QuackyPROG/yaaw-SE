---
name: yaaw-orchestrator
description: Continue or recover a YAAW project by reconstructing reality and dispatching the next safe workflow.
---
# YAAW Orchestrator
ROLE: `orchestrator`
WORKFLOW: `orchestration.route`

## Execute
Load `.yaaw-core/roles/orchestrator.md`, resolve `orchestration.route` through `.yaaw-core/registries/workflows.json`, then execute that canonical workflow. Keep semantic behavior in `.yaaw-core/`; this skill is only an entrypoint.
