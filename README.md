# YAAW-SE

**Autonomous software engineering with durable context.**

YAAW-SE turns an idea or change request into planned, implemented, independently reviewed work without making every new AI session start from zero.

> **Agents are disposable. Artifacts are durable.**

YAAW keeps product decisions, engineering decisions, specs, tickets, reviews, and evidence in the project so the workflow can reconstruct what is true and continue from there.

## Start Building

**Prerequisite:** Node.js 20.12+

Run YAAW-SE inside your project:

```bash
npx yaaw-se install
```

Choose the AI coding tools you want to use, finish the installer, then open your project in one of them and invoke:

```text
yaaw-orchestrator
```

The Orchestrator inspects the project, determines what is missing or ready, and routes the next valid workflow. Under Codex, orchestrated PRD/Planner/Implementer/Reviewer work runs in fresh authority-worker contexts when the host supports it; durable artifacts remain the source of truth.

You can start with only an idea, an existing codebase, a partially planned feature, or work already in progress.

## Why YAAW?

AI coding tools are good at producing code, but long-running software work needs more than a conversation history.

- **Autonomous continuity** — YAAW reconstructs project state and decides what workflow should happen next.
- **Durable context** — Product and engineering decisions survive new chats, new agents, and interrupted sessions.
- **Artifact-first development** — PRDs, specs, tickets, reviews, and evidence become the source of truth.
- **Independent review** — Implementation does not approve itself; review is a separate authority.
- **Repository-aware planning** — Engineering work is grounded in the actual codebase instead of invented assumptions.
- **One workflow from idea to reviewed code** — Plan, implement, review, repair, and continue without manually rebuilding context.

## How It Flows

```text
Idea / Change
      ↓
     PRD
      ↓
 Engineering Plan
      ↓
 Spec + Tickets
      ↓
 Implementation
      ↓
 Independent Review
   ↙       ↓       ↘
Repair   Replan    Pass
   \       |       /
      Continue
```

You do not need to manually run every stage. In normal use, `yaaw-orchestrator` is the main entrypoint and routes work based on the artifacts already present.

## Supported AI Coding Tools

| Tool | Support |
| --- | --- |
| OpenAI Codex | Supported |
| Claude Code | Supported |
| Gemini CLI | Supported |
| Cline | Supported |

Multiple tools can be installed into the same project. They share the same YAAW project memory instead of maintaining separate workflow state.

## Useful Entry Points

Most users can stay with `yaaw-orchestrator`.

| Skill | Use it when |
| --- | --- |
| `yaaw-orchestrator` | You want YAAW to inspect the project and continue the workflow |
| `yaaw-prd` | You want to work directly on product definition |
| `yaaw-planner` | You want to work directly on engineering planning |
| `yaaw-implement` | You want to implement an admitted ticket |
| `yaaw-review` | You want to independently review current work |

The installer can also expose direct shortcuts for revising PRDs, creating specs or tickets, repair work, and planning review.

## Project Memory

YAAW stores its project-local state under:

```text
.yaaw-core/
```

That includes both the YAAW system and the durable project artifacts it creates. Package updates are designed to refresh the system without replacing your project memory.

## Manage an Installation

Check an installation:

```bash
npx yaaw-se status
npx yaaw-se doctor
```

Run the installer again to update, change integrations, repair, or safely uninstall YAAW-SE.

Package-managed `.yaaw-core/system/**` is immutable during normal YAAW execution. If Orchestrator detects framework drift, it stops before routing semantic work instead of editing its own governing contracts.

For an installation whose managed framework files were modified, use backup-and-replace repair:

```bash
npx yaaw-se install --action repair --conflict-policy backup-replace --yes
```

Modified package bytes are preserved under `.yaaw-core/install/backups/<timestamp>/...` before the package version is restored. Durable `.yaaw-core/project/**` remains untouched, while replaceable runtime handoff/observation/intent caches are regenerated after the framework basis changes.

To explicitly use the latest published version:

```bash
npx yaaw-se@latest install
```

## More

- [Distribution and update behavior](docs/distribution.md)
- [Coding-tool integrations](docs/integrations.md)
- [Codex isolated-worker runtime](docs/codex-runtime.md)
- [Report a bug or request a feature](https://github.com/QuackyPROG/yaaw-SE/issues)
