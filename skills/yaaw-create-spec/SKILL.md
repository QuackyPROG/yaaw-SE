---
name: yaaw-create-spec
description: Create the next YAAW specification from an engineering frontier whose readiness is currently PASS.
---
# YAAW Create Spec
ROLE: `planner`
WORKFLOW: `planning.create-spec`

## Execute
Load `.yaaw-core/system/roles/planner.md`, resolve `planning.create-spec` through `.yaaw-core/system/registries/workflows.json`, then execute that canonical workflow. Keep semantic behavior in `.yaaw-core/system/`; this skill is only an entrypoint.
