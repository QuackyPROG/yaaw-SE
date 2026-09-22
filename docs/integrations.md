# Integration adapters

YAAW providers are discovery/invocation adapters around one canonical engine.

| ID | Skills root | Bootstrap | Maturity |
| --- | --- | --- | --- |
| `codex` | `.agents/skills` | `AGENTS.md` managed section | stable |
| `claude-code` | `.claude/skills` | `CLAUDE.md` managed section | stable |
| `gemini-cli` | `.gemini/skills` | `GEMINI.md` managed section | stable |
| `cline` | `.cline/skills` | `.cline/rules/yaaw-se.md` | stable |

Detection is informational. A missing host executable never blocks explicit selection.

Every adapter implements one registry contract: detect, skills root, bootstrap planning, skill planning, verification, and invocation hints. Adding a provider should require one adapter registration plus tests rather than conditionals spread throughout installer logic.

Generated provider skills remain semantically identical to canonical `skills/*/SKILL.md` and keep project-root-relative references to `.yaaw-core`.
