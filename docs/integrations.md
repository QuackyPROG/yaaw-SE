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


## Codex adapter v3

Codex is the first provider with a host-specific runtime layer in addition to thin skills/bootstrap. The canonical YAAW router still selects the role/workflow; the Codex adapter only decides how to execute that already-selected handoff.

A Codex consumer gets `.codex/yaaw-runtime.md`, four runtime-only authority-role config files, and YAAW-owned role declarations in the project's shared `.codex/config.toml`. The root Codex session remains Orchestrator, so no Orchestrator child role is generated.

The Codex adapter supports `auto`, `isolated-required`, and `inline` modes. `auto` prefers a named worker, falls back to a generic isolated worker, then to inline execution. Named-role availability is a runtime capability and is not inferred merely from installed config files.

Codex project configuration is managed at semantic-key granularity. Existing unrelated model settings, MCP servers, profiles, hooks, comments, custom agents, and formatting remain user-owned. See [Codex runtime](codex-runtime.md).


## Provider configuration lifecycle

Provider configuration capability revisions are independent from package and adapter versions. The installation manifest records the settings a project actually chose, the revision under which those settings were reviewed, and the newest revision already shown to the user.

A normal framework update may announce newer configuration capabilities, but it does not silently change model/runtime policy. Interactive updates acknowledge a shown notice once; headless updates keep reporting it until a human configures the provider.

`yaaw config [integration]` is a configuration-only transaction. It updates only the selected integration's YAAW-managed configuration surface and manifest metadata, while reusing the same ownership/conflict rules as installation. It does not refresh the whole framework, copy skills, or mutate other integrations.

Codex currently provides the full configuration capability. Claude Code, Gemini CLI, and Cline remain installable integrations but do not advertise model configurators until provider-specific support exists.
