# Codex runtime

YAAW-SE keeps the root Codex session as Orchestrator during autonomous operation. PRD, Planner, Implementer, and Reviewer are disposable authority-worker execution contexts; their canonical semantics still live under `.yaaw-core/system/`.

## Runtime modes

- `auto` (default): named YAAW worker -> generic fresh worker -> inline fallback.
- `isolated-required`: named -> generic worker, then `BLOCKED:HOST_ISOLATION_UNAVAILABLE` if isolation is unavailable.
- `inline`: legacy same-context execution.

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
.yaaw-core/
```

There is intentionally no `yaaw-orchestrator.toml`: the root session is Orchestrator.

## Configuration ownership

`.codex/config.toml` is shared user configuration. YAAW manages only semantic keys it explicitly owns. Existing unrelated model settings, MCP servers, profiles, hooks, custom agents, comments, and formatting remain user-owned.

`inherit` means YAAW does not write or own that global setting. The namespaced `agents.yaaw_*` role declarations are YAAW-owned; a pre-existing role using one of those names is treated as a conflict.

Role TOML files contain runtime/model configuration only. Workflow instructions are never duplicated into `.codex/`.

## Fresh context and recovery

Each Orchestrator dispatch is one fresh authority execution when isolation is available. Workers receive the workspace root and handoff path, then load only canonical admitted context. A worker does not route peer YAAW authority roles.

After success, error, interruption, or lost response, Orchestrator re-inspects durable reality before choosing another workflow. Worker text is never accepted as project truth by itself.

Reviewer never reuses the Implementer authority context for orchestrated acceptance.

## Configuration CLI

Common headless flags:

```text
--codex-runtime <auto|isolated-required|inline>
--codex-root-model <inherit|MODEL>
--codex-root-reasoning <inherit|VALUE>
--codex-worker-model <inherit|MODEL>
--codex-worker-reasoning <inherit|VALUE>
--codex-max-agents <inherit|NUMBER>
--codex-config <path>
```

Full configuration files use schema `yaaw.codex-install/v1`. They must not contain credentials.

Quick Update and Repair preserve existing manifest runtime settings. Existing pre-v2 Codex integrations migrate conservatively to `auto` with all model, sandbox, approval, web-search, and concurrency settings inherited.

## Trust and session reload

YAAW writes Codex settings only inside the selected consumer project. It never edits `~/.codex/config.toml`, project trust, or credentials.

After YAAW changes project `.codex/config.toml`, start a new Codex session/task. Codex only loads project-local `.codex` configuration for trusted projects.

## Capability vs configuration

Installed role files and config declarations show that the project is configured for YAAW workers. They do not prove the active Codex runtime exposes named-role spawning. Runtime behavior follows `.codex/yaaw-runtime.md` and its fallback ladder.
