---
name: yaaw-create-spec
description: Create the next YAAW specification from an engineering frontier whose readiness is currently PASS.
---
# YAAW Create Spec
ROLE: `planner`
WORKFLOW: `planning.create-spec`

## Execute
Load `.yaaw-core/roles/planner.md`, resolve `planning.create-spec` through `.yaaw-core/registries/workflows.json`, then execute that canonical workflow. Keep semantic behavior in `.yaaw-core/`; this skill is only an entrypoint.
