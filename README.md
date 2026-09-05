# YAAW-SE v2

YAAW-SE v2 is an artifact-first autonomous software-engineering workflow.

> **Agents are disposable. Artifacts are durable.**

`skills/` is the public workflow API. `.yaaw-core/` is the canonical implementation. A consuming project stores durable memory under `.yaaw/`.

## Public skills
Core smart entrypoints:
- `@yaaw-orchestrator` — reconstruct reality and continue/recover autonomously.
- `@yaaw-prd` — create/continue/refine/revise product definition.
- `@yaaw-planner` — continue engineering discovery, decisions, readiness, spec, or ticket planning.
- `@yaaw-implement` — implement one admitted ticket.
- `@yaaw-review` — independently review current work.

Direct shortcuts using the same canonical workflows:
- `@yaaw-revise-prd`
- `@yaaw-refine-prd`
- `@yaaw-planning-review`
- `@yaaw-create-spec`
- `@yaaw-create-ticket`
- `@yaaw-create-tickets`
- `@yaaw-repair`

## Core model
Each execution composes **Role** (authority) + **Workflow** (process) + relevant **Expertise** (specialist knowledge). Expertise never grants authority.

## Project memory
```text
.yaaw/
├── product.md
├── engineering.md
├── state.json
├── specs/
├── tickets/
├── reviews/
├── evidence/
├── rules/
└── runtime/
    ├── observed-state.json
    └── handoff.json
```

State is a claim/routing cache. Product intent, engineering contracts, repository reality, and fresh review evidence have domain-specific authority. Runtime files are replaceable coordination caches and must be revalidated before use.

See `.yaaw-core/README.md` for lifecycle, transition, invalidation, and recovery contracts.
