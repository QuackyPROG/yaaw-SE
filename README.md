# YAAW-SE v2

YAAW-SE is an artifact-first autonomous software-engineering workflow.

> **Agents are disposable. Authority is durable. History can be remembered. Context is reconstructed.**

## Architecture

```text
skills/        -> public desired-intent entrypoints
.yaaw-core/    -> canonical workflow implementation
docs/          -> durable authoritative project knowledge
.yaaw/         -> autonomous execution state
project memory -> optional derived historical context (for example Hindsight)
```

There are five semantic authority roles: PRD, Planner, Implementer, Reviewer, and Orchestrator. Orchestrator is the team lead/traffic controller: it reconstructs reality, resolves prerequisites, persists lifecycle state, assigns an exact context policy, and dispatches exactly one semantic workflow at a time. It does not author product meaning, architecture, implementation, or acceptance.

Core rule:

> **Roles do work. Orchestrator decides work. Memory explains history; it never decides truth.**

Roles do not privately spawn each other. They communicate through durable artifacts, exact `.yaaw/runtime/handoff.json` contracts, and typed results returned to Orchestrator.

## Canonical artifacts

```text
docs/product/product.md
docs/engineering/engineering.md
docs/engineering/decisions/ENG-*.md
docs/specs/<SPEC-ID>.md
docs/rules/**

.yaaw/tickets/<SPEC-ID>/<TASK-ID>.md
.yaaw/evidence/<SPEC-ID>/<TASK-ID>-V<VERSION>.json
.yaaw/reviews/<SPEC-ID>/<TASK-ID>/R<ROUND>.md
.yaaw/runtime/intent.json
.yaaw/runtime/observed-state.json
.yaaw/runtime/handoff.json
.yaaw/state.json
```

`registries/artifacts.json` is the machine-readable path authority; `registries/role-io.json` defines role I/O authority; `registries/context-policy.json` defines when each role may use optional project memory and its target context budget. Every dispatch resolves these contracts into an exact handoff, so semantic roles do not wander the project looking for workflow artifacts or dump the whole project history into context.

For tickets:

> **Planner owns content. Orchestrator owns lifecycle. Implementer owns execution. Reviewer owns acceptance.**

## Context-efficient disposable roles

A fresh role starts from the exact handoff and authoritative references, then uses optional project memory only when its role policy allows it:

```text
exact handoff / task
        ↓
current authoritative artifacts
        ↓
focused project-memory search (when allowed)
        ↓
targeted verification of current code/evidence
        ↓
broad repository discovery only if a gap remains
        ↓
work
```

This lets a disposable Planner/Implementer recover relevant component history, conventions, prior decisions, or previous fixes without repeatedly reconstructing the entire repository. Hindsight is the reference memory provider: search curated knowledge first, read a page only when needed, and use deep reflection only for missing rationale/history.

Memory is always advisory. Current human authority, current YAAW artifacts, and current repository/evidence reality win. Orchestrator does not use semantic memory for routing/reconciliation; Reviewer performs its primary acceptance inspection before memory and never treats memory as evidence for `PASS`.

YAAW must remain fully functional when memory is disabled or unavailable.

## Autonomous prerequisite chain

A public skill names a desired destination, not permission to skip prerequisites. For example `@yaaw-implement` means “get the project safely to implementation and continue the valid lifecycle,” not “run Implementer immediately.”

```text
product missing/unready
→ PRD
→ engineering unresolved
→ Planner
→ readiness PASS, no spec
→ create spec
→ accepted spec, no executable ticket
→ create tickets
→ one READY ticket
→ Implementer
→ Reviewer
→ repair / replan / next ticket / next frontier / COMPLETE
```

Implementer has a hard gate: without one exact admitted ticket and current source spec, it makes no code changes and returns `PRECONDITION_UNSATISFIED`. Orchestrator then resolves the missing prerequisite.

## Skills

All public skills enter Orchestrator with a desired intent:

- `@yaaw-orchestrator` — autonomous continuation (`AUTO`)
- `@yaaw-prd` — product intent
- `@yaaw-revise-prd` — product revision
- `@yaaw-refine-prd` — product clarity refinement
- `@yaaw-planner` — engineering planning
- `@yaaw-planning-review` — readiness review
- `@yaaw-create-spec` — specification
- `@yaaw-create-ticket`
- `@yaaw-create-tickets` — ticket decomposition
- `@yaaw-implement` — implementation
- `@yaaw-repair` — repair
- `@yaaw-review` — independent review

Prerequisites always outrank desired intent.

## Bootstrap

The user never needs to pre-create `docs/` or `.yaaw/`. Entry workflows ensure the canonical tree exists idempotently, equivalent to:

```text
python scripts/init_project.py /path/to/project
```

Existing durable content is never overwritten. Project-memory availability is not part of bootstrap and never blocks YAAW.

## Verification

```text
python scripts/validate_core.py
python scripts/validate_behavior.py
python scripts/behavior_oracle.py
python -m unittest discover -s tests -v
```

See `WORKFLOW.md` for the lifecycle and `.yaaw-core/core/io-contract.md`, `artifact-model.md`, `folder-ownership.md`, `authority.md`, `routing.md`, `context-loading.md`, and `project-memory.md` for normative contracts.
