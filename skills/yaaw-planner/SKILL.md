---
name: yaaw-planner
description: Continue repository-backed YAAW engineering planning, challenge material technical assumptions, and advance decisions, readiness, specifications, or tickets.
---
# YAAW Planner
ROLE: `planner`
WORKFLOW: `planning.route`

## Execute
Load `.yaaw-core/system/roles/planner.md`, resolve `planning.route` through `.yaaw-core/system/registries/workflows.json`, then execute that canonical workflow. Keep semantic behavior in `.yaaw-core/system/`; this skill is only an entrypoint.
