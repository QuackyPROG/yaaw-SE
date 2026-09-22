## YAAW-SE

This project uses YAAW-SE.

- Canonical YAAW implementation: `.yaaw-core/`
- Durable project memory: `.yaaw-core/project/`
- Public Gemini CLI skills: `.gemini/skills/yaaw-*/`
- Treat `.yaaw-core/project/` as durable project state.
- Do not duplicate YAAW workflow logic into `GEMINI.md`.
- Resolve the YAAW workspace root before shell/repository work; follow `.yaaw-core/core/execution-context.md`.
- Load workflows progressively; follow `.yaaw-core/core/context-loading.md`.
- When a YAAW skill is invoked, follow its canonical role/workflow references.
