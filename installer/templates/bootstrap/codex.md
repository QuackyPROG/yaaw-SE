## YAAW-SE

This project uses YAAW-SE.

- Canonical compact system contract: `.yaaw-core/system/SYSTEM.md`
- Machine kernel: `.yaaw-core/system/kernel.yaml`
- Deterministic runtime: `.yaaw-core/system/engine/runtime.mjs`
- Durable project memory: `.yaaw-core/project/`
- Replaceable coordination: `.yaaw-core/runtime/`
- Public Codex skills: `.agents/skills/yaaw-*/`
- Codex execution adapter: `.codex/yaaw-runtime.md`
- Never treat runtime cache or worker prose as semantic truth; reconstruct from durable artifacts.
- When a YAAW skill is invoked, run the compact runtime with `--invoke-skill <skill-id>`; never execute semantic role logic directly from the wrapper.
- When runtime returns `DISPATCH_READY`, follow `.codex/yaaw-runtime.md` for host-specific isolated authority execution.
