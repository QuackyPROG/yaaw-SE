## YAAW-SE

This project uses YAAW-SE.

- Canonical compact system contract: `.yaaw-core/system/SYSTEM.md`
- Machine kernel: `.yaaw-core/system/kernel.yaml`
- Deterministic runtime: `.yaaw-core/system/engine/runtime.mjs`
- Durable project memory: `.yaaw-core/project/`
- Replaceable coordination: `.yaaw-core/runtime/`
- Public Claude Code skills: `.claude/skills/yaaw-*/`
- Never treat runtime cache or worker prose as semantic truth; reconstruct from durable artifacts.
- When a YAAW skill is invoked, run the compact runtime with `--invoke-skill <skill-id>`; never execute semantic role logic directly from the wrapper.
