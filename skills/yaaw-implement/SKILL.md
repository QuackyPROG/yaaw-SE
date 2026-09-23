---
name: yaaw-implement
description: Implement one admitted READY YAAW ticket and produce repository-identity-bound verification evidence.
---
# YAAW Implement
ROLE: `implementer`
WORKFLOW: `implementation.implement-ticket`

## Execute
Load `.yaaw-core/system/roles/implementer.md`, resolve `implementation.implement-ticket` through `.yaaw-core/system/registries/workflows.json`, then execute that canonical workflow. Keep semantic behavior in `.yaaw-core/system/`; this skill is only an entrypoint.
