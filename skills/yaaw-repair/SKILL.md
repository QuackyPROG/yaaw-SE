---
name: yaaw-repair
description: Repair a YAAW ticket in REPAIR_REQUIRED state while preserving its accepted product and engineering contract.
---
# YAAW Repair
ROLE: `implementer`
WORKFLOW: `implementation.repair-ticket`

## Execute
Load `.yaaw-core/roles/implementer.md`, resolve `implementation.repair-ticket` through `.yaaw-core/registries/workflows.json`, then execute that canonical workflow. Keep semantic behavior in `.yaaw-core/`; this skill is only an entrypoint.
