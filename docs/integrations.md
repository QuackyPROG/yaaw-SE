# Integration adapters

YAAW providers are discovery/invocation adapters around one canonical engine under `.yaaw-core/system/`.

| ID | Skills root | Bootstrap | Maturity |
| --- | --- | --- | --- |
| `codex` | `.agents/skills` | `AGENTS.md` managed section | stable |
| `claude-code` | `.claude/skills` | `CLAUDE.md` managed section | stable |
| `gemini-cli` | `.gemini/skills` | `GEMINI.md` managed section | stable |
| `cline` | `.cline/skills` | `.cline/rules/yaaw-se.md` | stable |

Detection is informational. A missing host executable never blocks explicit selection.

Every adapter implements one registry contract: detect, skills root, bootstrap planning, skill planning, verification, invocation hints, and an `adapterVersion`. Adding a provider should require one adapter registration plus tests rather than conditionals spread throughout installer logic.

Generated provider skills remain semantically identical to canonical `skills/*/SKILL.md` and keep project-root-relative references to `.yaaw-core/system/`.

## Adapter updates

The install manifest records the adapter version used for each selected tool. Quick Update regenerates selected adapters from the current package and removes obsolete YAAW-owned provider files through manifest ownership.

If an installed adapter version is newer than the running package supports, the installer blocks the downgrade rather than guessing how to rewrite newer provider state.

Changing or removing one provider must not modify another provider's surface or durable `.yaaw-core/project/` data.

## Runtime parity

All provider adapters point to the same `.yaaw-core/system/core/execution-context.md` and `.yaaw-core/system/core/context-loading.md` contracts. No provider may substitute ambient CWD, preload a different workflow graph, or treat an installed host skill as semantic authority. Provider-specific expertise remains advisory and is admitted only by the canonical research rule.
