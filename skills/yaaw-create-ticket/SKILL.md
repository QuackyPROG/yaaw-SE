---
name: yaaw-create-ticket
description: Create bounded YAAW implementation ticket contracts from the current accepted specification.
---
# YAAW Create Ticket
ROLE: `planner`
WORKFLOW: `planning.create-tickets`

## Execute
Load `.yaaw-core/roles/planner.md`, resolve `planning.create-tickets` through `.yaaw-core/registries/workflows.json`, then execute that canonical workflow. Keep semantic behavior in `.yaaw-core/`; this skill is only an entrypoint.
