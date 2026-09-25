# Codex runtime

YAAW-SE keeps the root Codex session as Orchestrator during autonomous operation. PRD, Planner, Implementer, and Reviewer are disposable authority-worker execution contexts; their canonical semantics still live under `.yaaw-core/system/`.

## Runtime modes

- `auto` (default): exact named worker first; generic and then inline are permitted only when the configured effective authority profile is preserved.
- `isolated-required`: exact named worker first, then only profile-equivalent/correctable generic isolation. No isolation returns `BLOCKED:HOST_ISOLATION_UNAVAILABLE`; isolation that cannot honor the profile returns `BLOCKED:HOST_EXECUTION_PROFILE_UNAVAILABLE`.
- `inline`: deliberate same-context execution. Per-role model isolation is not provided in this mode.

Direct public role invocation may still run in the current context. The isolation ladder applies to Orchestrator dispatch.

## Project layout

A Codex installation creates:

```text
AGENTS.md
.agents/skills/yaaw-*/
.codex/
  config.toml
  yaaw-runtime.md
  agents/
    yaaw-prd.toml
    yaaw-planner.toml
    yaaw-implementer.toml
    yaaw-reviewer.toml
    yaaw-implementer-fallback.toml  # when failure fallback is enabled
    yaaw-reviewer-fallback.toml     # when failure fallback is enabled
.yaaw-core/
```

There is intentionally no `yaaw-orchestrator.toml`: the root session is Orchestrator.

## Configuration ownership

`.codex/config.toml` is shared user configuration. YAAW manages only semantic keys it explicitly owns. Existing unrelated model settings, MCP servers, profiles, hooks, custom agents, comments, and formatting remain user-owned.

`inherit` means YAAW does not write or own that global setting. The namespaced `agents.yaaw_*` role declarations are YAAW-owned; a pre-existing role using one of those names is treated as a conflict.

Role TOML files contain runtime/model configuration only. Workflow instructions are never duplicated into `.codex/`.

Custom configuration also exposes Codex `service_tier`: inherit, Standard (`default`), Fast (`fast`), or Flex (`flex`). Recommended leaves the tier inherited and therefore **does not turn Fast mode on**. Fast is a latency/cost choice, not a quality escalation; Astra is the quality fallback.

## Fresh context and recovery

Each Orchestrator dispatch is one fresh authority execution when isolation is available. Workers receive the workspace root and handoff path, then load only canonical admitted context. A worker does not route peer YAAW authority roles.

After success, error, interruption, or lost response, Orchestrator re-inspects durable reality before choosing another workflow. Worker text is never accepted as project truth by itself.

Reviewer never reuses the Implementer authority context for orchestrated acceptance.

## Astra capability fallback

YAAW supports `gpt-6-astra` as a Codex model. Astra requires Codex CLI 0.153.0 or newer.

The Recommended profile keeps normal Orchestrator/worker execution on GPT-6 Sol, then enables a bounded escalation for the two roles where repeated execution failure is most expensive:

- Implementer: after 3 consecutive no-progress **execution** failures on the same handoff basis, retry once with GPT-6 Astra / high reasoning.
- Reviewer: after the same threshold, retry once with GPT-6 Astra / high reasoning.

A failure counts only after reality inspection confirms that the child failed/interrupted/disappeared or returned an unusable result **and** made no durable progress. Legal semantic outcomes such as `REPAIR`, `REPLAN`, `BLOCKED`, or a real precondition result do not increment the counter.

The counter is stored only in replaceable `.yaaw-core/runtime/dispatch-failures.json`. It resets when the role/workflow/work item/revisions/repository basis changes or durable progress is observed. If the Astra fallback also fails without progress on the unchanged basis, YAAW stops with `BLOCKED:AUTHORITY_EXECUTION_FAILED` rather than looping indefinitely.

## Authority execution profile fidelity

Codex adapter v5 makes model/reasoning fidelity a dispatch invariant. For each authority, YAAW resolves model and reasoning independently using:

```text
authority setting
  ?? default worker setting
  ?? orchestrator/root setting
  ?? HOST_INHERIT
```

Implementer/Reviewer capability-fallback profiles use the same resolver with the fallback role setting as the authority-specific layer.

The named YAAW worker remains preferred. If named selection is unavailable before a child starts, a generic worker is legal only when its baseline is already equivalent or the active spawn schema exposes authoritative overrides for every mismatched dimension. If generic cannot preserve the profile, `auto` may use inline only when the root profile is equivalent. Otherwise dispatch fails closed with `BLOCKED:HOST_EXECUTION_PROFILE_UNAVAILABLE`.

`HOST_INHERIT` is symbolic. YAAW never guesses a concrete model from an inherited value. Two unresolved paths may be treated as equivalent only when they share the same inheritance chain.

Changing the execution mechanism is allowed; silently changing the configured effective authority profile is not. Prompt text or worker self-report is never accepted as proof of the actual model/reasoning configuration.

The generated `.codex/yaaw-runtime.md` includes the primary authority profiles, optional capability-fallback profiles, generic-worker baseline, and inline/root baseline. This is generated execution metadata from the same normalized settings stored in the installation manifest; it is not a second mutable configuration source.

A pre-execution profile/isolation block means no authority child ran. It does not increment `.yaaw-core/runtime/dispatch-failures.json` and cannot by itself trigger Astra escalation.

### Troubleshooting `BLOCKED:HOST_EXECUTION_PROFILE_UNAVAILABLE`

This means YAAW knew the authority and configured execution profile, but the active Codex execution mechanism could not guarantee that profile. It does **not** mean the Reviewer, Implementer, ticket, or Astra execution failed. Remedies are to use a Codex runtime that supports the required named/override capability, change the project-local Codex configuration, or deliberately select inline mode if per-role isolation is not required.

## Configuration CLI

Common headless flags:

```text
--codex-runtime <auto|isolated-required|inline>
--codex-root-model <inherit|MODEL>
--codex-root-reasoning <inherit|VALUE>
--codex-worker-model <inherit|MODEL>
--codex-worker-reasoning <inherit|VALUE>
--codex-max-agents <inherit|NUMBER>
--codex-service-tier <inherit|default|fast|flex>
--codex-config <path>
```

Full configuration files use schema `yaaw.codex-install/v1`. They must not contain credentials.

Quick Update and Repair preserve existing manifest runtime settings. Adapter v5 is a mechanics/fidelity update: `CODEX_CONFIGURATION_REVISION` remains 4, so updating the adapter does not reapply Recommended or force a configuration migration. Existing pre-v2 Codex integrations migrate conservatively to `auto` with all model, sandbox, approval, web-search, and concurrency settings inherited.

## Trust and session reload

YAAW writes Codex settings only inside the selected consumer project. It never edits `~/.codex/config.toml`, project trust, or credentials.

After YAAW changes project `.codex/config.toml`, start a new Codex session/task. Codex only loads project-local `.codex` configuration for trusted projects.

## Capability vs configuration

Installed role files and config declarations show that the project is configured for YAAW workers. They do not prove the active Codex runtime exposes named-role spawning. Runtime behavior follows `.codex/yaaw-runtime.md` and its fallback ladder.


## Recommended, inherit, custom, and inline profiles

Interactive Codex configuration now starts with four progressively disclosed choices:

- **Recommended**: apply the current YAAW role profile from the release-curated Codex catalog.
- **Inherit Codex defaults**: keep model and reasoning selection outside YAAW.
- **Custom**: choose execution mode, model strategy, role assignments, and optional advanced settings.
- **Inline only**: do not spawn authority workers.

Known models and allowed reasoning values are release-curated. GPT-6 Astra, Sol, and Luna expose low, medium, high, xhigh, and max in this catalog. The model picker always includes a custom-model escape hatch, so a project can use an enterprise/private model or a model released after its YAAW version.

The selected profile is intent metadata; normalized runtime settings remain the execution truth.

## Configuration revisions and updates

Codex configuration revisions are separate from YAAW package versions and Codex adapter versions. Existing installations migrate to a conservative legacy revision without changing their stored runtime values.

When a newer YAAW release contains a newer Codex configuration revision, Quick Update preserves the current settings and may show what is newly available. It never switches a project to a newer model or Recommended profile automatically.

Review or change the project-local configuration with:

```bash
yaaw config codex
```

A config-only transaction updates `.codex/config.toml`, YAAW authority-worker TOMLs, and configuration metadata only. User-owned Codex settings, MCP servers, and non-YAAW agents remain protected by the existing managed-key ownership rules.
