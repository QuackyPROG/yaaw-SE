---
name: yaaw-refine-prd
description: Improve clarity and completeness of a YAAW product artifact without changing accepted product meaning.
---
# YAAW Refine PRD
ROLE: `prd`
WORKFLOW: `prd.refine`

## Execute
Load `.yaaw-core/roles/prd.md`, resolve `prd.refine` through `.yaaw-core/registries/workflows.json`, then execute that canonical workflow. Keep semantic behavior in `.yaaw-core/`; this skill is only an entrypoint.
