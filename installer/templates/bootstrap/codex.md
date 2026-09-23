## YAAW-SE

This project uses YAAW-SE.

- Canonical YAAW implementation: `.yaaw-core/system/`
- Durable project memory: `.yaaw-core/project/`
- Public Codex skills: `.agents/skills/yaaw-*/`
- Codex execution adapter: `.codex/yaaw-runtime.md`
- Treat `.yaaw-core/project/` as durable project state.
- Do not duplicate YAAW workflow logic into `AGENTS.md` or `.codex/`.
- Resolve the YAAW workspace root before shell/repository work; follow `.yaaw-core/system/core/execution-context.md`.
- Load workflows progressively; follow `.yaaw-core/system/core/context-loading.md`.
- When a YAAW skill is invoked, follow its canonical role/workflow references.
- When autonomous orchestration reaches `orchestration.dispatch`, follow `.codex/yaaw-runtime.md` for host-specific isolated-worker execution.
