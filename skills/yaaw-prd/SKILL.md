---
name: yaaw-prd
description: Create or continue YAAW product definition, challenge material product assumptions, and route clarification or revision work.
---
# YAAW PRD
ROLE: `prd`
WORKFLOW: `prd.route`

## Execute
Load `.yaaw-core/roles/prd.md`, resolve `prd.route` through `.yaaw-core/registries/workflows.json`, then execute that canonical workflow. Keep semantic behavior in `.yaaw-core/`; this skill is only an entrypoint.
