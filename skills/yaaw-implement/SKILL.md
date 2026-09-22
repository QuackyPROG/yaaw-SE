---
name: yaaw-implement
description: Implement one admitted READY YAAW ticket and produce repository-identity-bound verification evidence.
---
# YAAW Implement
ROLE: `implementer`
WORKFLOW: `implementation.implement-ticket`

## Execute
Load `.yaaw-core/roles/implementer.md`, resolve `implementation.implement-ticket` through `.yaaw-core/registries/workflows.json`, then execute that canonical workflow. Keep semantic behavior in `.yaaw-core/`; this skill is only an entrypoint.
