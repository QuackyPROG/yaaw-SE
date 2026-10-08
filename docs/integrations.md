# Integration adapters

YAAW providers are discovery/invocation adapters around one canonical compact engine under `.yaaw-core/system/`.

| ID | Skills root | Bootstrap | Maturity |
| --- | --- | --- | --- |
| `codex` | `.agents/skills` | `AGENTS.md` managed section | stable |
| `claude-code` | `.claude/skills` | `CLAUDE.md` managed section | stable |
| `gemini-cli` | `.gemini/skills` | `GEMINI.md` managed section | stable |
| `cline` | `.cline/skills` | `.cline/rules/yaaw-se.md` | stable |

Detection is informational. A missing host executable never blocks explicit selection. Every adapter implements one installer contract: detect, skills root, bootstrap planning, skill planning, verification, invocation hints, and an `adapterVersion`.

Generated provider skills remain semantically identical to canonical `skills/*/SKILL.md`; they are thin public intents and never carry canonical workflow logic.

## Runtime parity

All providers share `.yaaw-core/system/SYSTEM.md`, `.yaaw-core/system/kernel.yaml`, and `.yaaw-core/system/engine/runtime.mjs`. No provider may substitute ambient CWD, invent a second lifecycle engine, preload a different workflow graph, or treat an installed host skill as semantic authority. Optional provider expertise is advisory; canonical modules are selected only after routing.

The runtime reconstructs aggregate state from durable artifacts. `.yaaw-core/runtime/` is replaceable, and no provider may depend on a durable global `project/state.json`.

## Adapter updates

The installation manifest records the adapter version used for each selected tool. Quick Update regenerates selected adapters from the current package and removes obsolete YAAW-owned provider files through manifest ownership. If an installed adapter version is newer than the running package supports, the installer blocks the downgrade rather than guessing how to rewrite newer provider state. Changing or removing one provider must not modify another provider's surface or durable `.yaaw-core/project/` data.

## Codex adapter v5

Codex has a host-specific execution layer in addition to thin skills/bootstrap. The canonical compact runtime selects the role/workflow; the Codex adapter only decides how to execute the already-selected exact handoff.

A Codex consumer gets `.codex/yaaw-runtime.md`, four primary authority-role config files, optional Implementer/Reviewer fallback role files when capability fallback is enabled, and YAAW-owned role declarations in the project's shared `.codex/config.toml`. The root Codex session remains Orchestrator, so no Orchestrator child role is generated.

The adapter supports `auto`, `isolated-required`, and `inline` modes, GPT-6 Astra model selection, bounded role-specific capability fallback, and explicit service-tier configuration. It resolves an effective model/reasoning profile for each authority and fails closed rather than silently substituting a different profile. `HOST_INHERIT` remains symbolic when the host value is unknown.

Codex configuration revision remains independent from adapter/package versions. Quick Update preserves stored profile/settings unless the user explicitly reconfigures them. Project configuration is managed at semantic-key granularity, preserving unrelated user settings, MCP servers, profiles, hooks, comments, custom agents, and formatting. See [Codex runtime](codex-runtime.md).

## Provider configuration lifecycle

Provider configuration capability revisions are independent from package and adapter versions. The installation manifest records the settings a project chose, the revision under which they were reviewed, and the newest revision already shown to the user. A framework update may announce newer capabilities but does not silently change model/runtime policy.

`yaaw config [integration]` is configuration-only. It updates only the selected integration's YAAW-managed configuration surface and manifest metadata using the same ownership/conflict rules as installation. It does not refresh the whole framework, copy skills, or mutate other integrations.

Codex currently provides the full configuration capability. Claude Code, Gemini CLI, and Cline remain installable integrations but do not advertise model configurators until provider-specific support exists.

## Public intent parity

All provider-generated public skills use the same intent-entry contract. A provider may use isolated workers or inline execution according to its host capabilities, but no shortcut may bypass Orchestrator preparation, framework integrity, derived-state reconstruction, repository requirements, or exact handoff validation.
