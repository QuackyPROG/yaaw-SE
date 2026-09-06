# YAAW-SE v2

YAAW-SE is an artifact-first autonomous software-engineering workflow.

> **Agents are disposable. Artifacts are durable.**

A PRD, planning, implementation, or review context may disappear. The project should still be resumable from repository reality plus durable artifacts.

## Architecture

```text
skills/        -> public workflow entrypoints
.yaaw-core/    -> canonical workflow implementation
docs/          -> durable project knowledge
.yaaw/         -> autonomous execution state
```

There are five authority roles:

- **PRD / Human** — product intent and scope.
- **Planner** — engineering decisions, specs, readiness, and ticket contracts.
- **Implementer** — code/tests for one admitted ticket plus verification evidence.
- **Reviewer** — independent acceptance and repair-vs-replan classification.
- **Orchestrator** — continuity, reconciliation, lifecycle, and routing.

The Orchestrator does not own product meaning, architecture, implementation, or acceptance.

## Folder ownership

YAAW separates durable documentation from execution artifacts.

```text
docs/
├── product/
│   └── product.md
├── engineering/
│   ├── engineering.md
│   └── decisions/
├── specs/
└── rules/

.yaaw/
├── tickets/
├── reviews/
├── evidence/
├── runtime/
└── state.json
```

The normative ownership contract is `.yaaw-core/core/folder-ownership.md`.

### Ownership summary

| Area | Owner |
|---|---|
| `docs/product/**` | Human / PRD |
| `docs/engineering/**` | Planner |
| `docs/specs/**` | Planner |
| `docs/rules/**` | Planner-controlled promotion |
| `.yaaw/tickets/**` contract content | Planner |
| application code/tests | Implementer |
| `.yaaw/evidence/**` | Implementer |
| `.yaaw/reviews/**` | Reviewer |
| `.yaaw/runtime/**`, `.yaaw/state.json` | Orchestrator |

For tickets specifically:

> **Planner owns content. Orchestrator owns lifecycle. Implementer owns execution. Reviewer owns acceptance.**

No role may silently rewrite another role's semantic artifact.

## Canonical flow

```text
PRD
  ↓
docs/product/product.md
  ↓
Planner discovery + engineering decisions
  ↓
docs/engineering/engineering.md
  ↓
readiness PASS
  ↓
docs/specs/SPEC-NNN.md
  ↓
Planner creates tickets from the accepted spec
  ↓
.yaaw/tickets/SPEC-NNN/TASK-NNN.md
  ↓
Implementer
  ↓
code + tests + .yaaw/evidence/**
  ↓
Reviewer
  ↓
.yaaw/reviews/**
  ↓
PASS / REPAIR / REPLAN / BLOCKED
```

A ticket is the Implementer's bounded handoff contract. It references the source spec and relevant engineering/product decisions, defines allowed scope, non-goals, acceptance criteria, required tests, dependencies, and expertise hints.

The Implementer does not invent or rewrite its own ticket. If implementation reveals that the contract is wrong, control returns to Planner through `REPLAN_REQUIRED`.

## Skills

Primary entrypoints:

- `@yaaw-orchestrator`
- `@yaaw-prd`
- `@yaaw-planner`
- `@yaaw-implement`
- `@yaaw-review`

Direct shortcuts include `@yaaw-revise-prd`, `@yaaw-refine-prd`, `@yaaw-planning-review`, `@yaaw-create-spec`, `@yaaw-create-ticket`, `@yaaw-create-tickets`, and `@yaaw-repair`.

All shortcuts resolve to canonical workflows in `.yaaw-core/`; they do not duplicate workflow logic.

## Bootstrap

From a YAAW checkout:

```text
python scripts/init_project.py /path/to/project
```

This creates the `docs/` knowledge tree and `.yaaw/` execution tree without overwriting existing project artifacts.

## Verification

```text
python scripts/validate_core.py
python scripts/validate_behavior.py
python scripts/behavior_oracle.py
python -m unittest discover -s tests -v
```

For the plain-English lifecycle, see `WORKFLOW.md`. For normative contracts, start with `.yaaw-core/core/folder-ownership.md`, `.yaaw-core/core/authority.md`, and `.yaaw-core/core/artifact-model.md`.
