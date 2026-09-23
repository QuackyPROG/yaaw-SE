---
name: yaaw-refine-prd
description: Improve clarity and completeness of a YAAW product artifact without changing accepted product meaning.
---
# YAAW Refine PRD
ROLE: `prd`
WORKFLOW: `prd.refine`

## Execute
Load `.yaaw-core/system/roles/prd.md`, resolve `prd.refine` through `.yaaw-core/system/registries/workflows.json`, then execute that canonical workflow. Keep semantic behavior in `.yaaw-core/system/`; this skill is only an entrypoint.
