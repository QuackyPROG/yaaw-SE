## YAAW-SE

This project uses YAAW-SE.

- Canonical YAAW implementation: `.yaaw-core/system/`
- Durable project memory: `.yaaw-core/project/`
- Public Claude Code skills: `.claude/skills/yaaw-*/`
- Treat `.yaaw-core/project/` as durable project state.
- Do not duplicate YAAW workflow logic into `CLAUDE.md`.
- Resolve the YAAW workspace root before shell/repository work; follow `.yaaw-core/system/core/execution-context.md`.
- Load workflows progressively; follow `.yaaw-core/system/core/context-loading.md`.
- When a YAAW skill is invoked, follow its canonical role/workflow references.
