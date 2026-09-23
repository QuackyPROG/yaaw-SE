---
name: yaaw-create-ticket
description: Create bounded YAAW implementation ticket contracts from the current accepted specification.
---
# YAAW Create Ticket
ROLE: `planner`
WORKFLOW: `planning.create-tickets`

## Execute
Load `.yaaw-core/system/roles/planner.md`, resolve `planning.create-tickets` through `.yaaw-core/system/registries/workflows.json`, then execute that canonical workflow. Keep semantic behavior in `.yaaw-core/system/`; this skill is only an entrypoint.
