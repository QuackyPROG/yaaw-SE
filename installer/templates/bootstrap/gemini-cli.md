## YAAW-SE

This project uses YAAW-SE.

- Canonical YAAW implementation: `.yaaw-core/`
- Durable project memory: `.yaaw-core/project/`
- Public Gemini CLI skills: `.gemini/skills/yaaw-*/`
- Treat `.yaaw-core/project/` as durable project state.
- Do not duplicate YAAW workflow logic into `GEMINI.md`.
- When a YAAW skill is invoked, follow its canonical role/workflow references.
