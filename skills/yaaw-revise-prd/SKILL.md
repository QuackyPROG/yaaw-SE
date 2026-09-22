---
name: yaaw-revise-prd
description: Change accepted YAAW product intent and invalidate downstream engineering contracts whose basis became stale.
---
# YAAW Revise PRD
ROLE: `prd`
WORKFLOW: `prd.revise`

## Execute
Load `.yaaw-core/roles/prd.md`, resolve `prd.revise` through `.yaaw-core/registries/workflows.json`, then execute that canonical workflow. Keep semantic behavior in `.yaaw-core/`; this skill is only an entrypoint.
