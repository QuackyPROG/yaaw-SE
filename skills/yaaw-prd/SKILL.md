---
name: yaaw-prd
description: Create or continue YAAW product definition, challenge material product assumptions, and route clarification or revision work.
---
# YAAW PRD
ROLE: `prd`
WORKFLOW: `prd.route`

## Execute
Load `.yaaw-core/system/roles/prd.md`, resolve `prd.route` through `.yaaw-core/system/registries/workflows.json`, then execute that canonical workflow. Keep semantic behavior in `.yaaw-core/system/`; this skill is only an entrypoint.
