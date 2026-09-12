# YAAW-SE v2

YAAW-SE v2 is an artifact-first autonomous software-engineering workflow.

> **Agents are disposable. Artifacts are durable.**

`skills/` is the public workflow API. `.yaaw-core/` is the canonical implementation. A consuming project stores durable memory under `.yaaw/`.

## Public skills
Core smart entrypoints:
- `@yaaw-orchestrator` — reconstruct reality and continue/recover autonomously.
- `@yaaw-prd` — create/continue product definition, challenge material product assumptions, and route clarification/revision work.
- `@yaaw-planner` — continue repository-backed engineering planning, challenge material technical assumptions, and advance readiness/spec/ticket work.
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
Each execution composes **Role** (authority) + **Workflow** (process) + applicable **Shared Rules** (cross-cutting behavior) + relevant **Expertise** (specialist knowledge). Shared rules and expertise never grant authority or create lifecycle stages.

PRD challenges whether the product meaning is coherent enough to plan. Planner first inspects repository reality, then challenges material technical assumptions and resolves only the current engineering frontier. Accepted conclusions are written to durable artifacts rather than retained as conversation transcripts.

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

## Initialize a target project
From a YAAW checkout:

```text
python scripts/init_project.py /path/to/project
```

Initialization is idempotent: it creates the durable `.yaaw/` layout and canonical starting artifacts without overwriting existing project memory.

## Behavioral conformance
YAAW keeps deterministic **validation infrastructure** for the lifecycle without turning that validator into a second runtime orchestrator.

- `.yaaw-core/registries/routing-policy.json` — machine-readable routing precedence used by conformance tests.
- `.yaaw-core/registries/transitions.json` — machine-readable legal ticket transition table.
- `tests/fixtures/lifecycle_cases.json` — A–Q lifecycle/recovery scenarios.
- `tests/fixtures/fresh_context_project/` — a complete durable artifact graph proving fresh-context reconstruction.
- `tests/fixtures/assumption_challenge_fresh_context/` — a focused example proving challenged conclusions survive without the original question wording.
- `scripts/behavior_oracle.py` — deterministic fixture oracle; validation-only, never semantic runtime authority.

Run:

```text
python scripts/validate_core.py
python scripts/validate_behavior.py
python scripts/behavior_oracle.py
python -m unittest discover -s tests -v
```

See `.yaaw-core/README.md` for lifecycle, transition, invalidation, recovery, shared-rule, and authority contracts.
