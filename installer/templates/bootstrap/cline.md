# YAAW-SE

This workspace uses YAAW-SE.

- Canonical YAAW implementation: `.yaaw-core/`
- Durable project memory: `.yaaw-core/project/`
- Public Cline skills: `.cline/skills/yaaw-*/`
- Treat `.yaaw-core/project/` as durable project state.
- Do not duplicate YAAW workflow logic into provider rules.
- When a YAAW skill is invoked, follow its canonical role/workflow references.
