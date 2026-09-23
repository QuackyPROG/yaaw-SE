---
name: yaaw-create-tickets
description: Create dependency-aware bounded YAAW implementation tickets from the current accepted specification.
---
# YAAW Create Tickets
ROLE: `planner`
WORKFLOW: `planning.create-tickets`

## Execute
Load `.yaaw-core/system/roles/planner.md`, resolve `planning.create-tickets` through `.yaaw-core/system/registries/workflows.json`, then execute that canonical workflow. Keep semantic behavior in `.yaaw-core/system/`; this skill is only an entrypoint.
