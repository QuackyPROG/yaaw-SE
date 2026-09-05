# YAAW-SE v2

YAAW-SE v2 is an artifact-first autonomous software-engineering workflow.

> Agents are disposable. Artifacts are durable.

The public API lives in `skills/`. Canonical behavior lives in `.yaaw-core/`. Project-specific durable memory lives in `.yaaw/` inside the project using YAAW.

## Public entrypoints

- `@yaaw-orchestrator` — reconstruct reality and choose the next valid workflow.
- `@yaaw-prd` — create, continue, revise, or refine product intent.
- `@yaaw-planner` — discover, question, decide, review readiness, specify, and ticket.
- `@yaaw-implement` — implement one admitted ticket.
- `@yaaw-review` — independently review actual work and evidence.

Convenience shortcuts route to the exact same canonical workflows: `@yaaw-revise-prd`, `@yaaw-refine-prd`, `@yaaw-create-spec`, `@yaaw-create-tickets`, and `@yaaw-repair`.

## Core model

YAAW composes three things for each execution context:

1. **Role** — who owns the judgment.
2. **Workflow** — what process is executing.
3. **Expertise** — specialist knowledge loaded only when relevant.

State is a routing cache, not universal truth. Repository contents, git evidence, accepted artifacts, and independent review evidence remain authoritative in their domains.

## Project artifacts

A project using YAAW should maintain:

```text
.yaaw/
├── product.md
├── engineering.md
├── state.json
├── specs/
├── tickets/
├── reviews/
├── evidence/
└── rules/
```

See `.yaaw-core/README.md` for the canonical architecture and lifecycle.
