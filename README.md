# YAAW-SE v2

YAAW-SE is an artifact-first autonomous software-engineering workflow.

> **Agents are disposable. Artifacts are durable. Learned experience may also persist. Only authoritative artifacts/evidence determine workflow truth.**

## Architecture

```text
skills/        -> public desired-intent entrypoints
.yaaw-core/    -> canonical workflow implementation
docs/          -> durable authoritative project knowledge
.yaaw/         -> autonomous execution state
project memory -> optional learned historical context (Hindsight is the first adapter)
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

## Contractual memory vs learned memory

YAAW has two deliberately different continuity layers:

```text
DURABLE CONTRACTUAL MEMORY
docs/ + .yaaw/ + repository/evidence
→ authoritative current project/workflow truth

LEARNED EXPERIENTIAL MEMORY
optional provider such as Hindsight
→ historical rationale, conventions, prior attempts, failures, similar work, initiatives
```

Hindsight is a reference adapter, not a dependency. YAAW never installs or enables it, never stores its credentials, and never changes routing/lifecycle semantics based on its output.

## Context-efficient disposable roles

A fresh semantic role starts from the exact handoff and authoritative references first:

```text
exact handoff / task
        ↓
current authoritative artifacts
        ↓
quarantine any host-injected memory
        ↓
focused learned-memory search (only when role policy allows)
        ↓
targeted verification of current code/evidence
        ↓
broad repository discovery only if a gap remains
        ↓
work
```

Planner and Implementer may use focused learned memory after understanding their current contract. Reviewer performs its primary acceptance/evidence inspection before memory. PRD and Orchestrator automatic learned-memory use is disabled.

Memory is always advisory and should remain visibly labeled/provenanced as learned context. Current human authority, current YAAW artifacts, and current repository/evidence reality win. Memory cannot establish an `ENG-*` decision, expand an implementation ticket, satisfy acceptance evidence, create lifecycle state, or determine routing.

Memory absence, disablement, unavailability, timeout, empty results, staleness, or error must degrade to the normal authoritative YAAW context without changing correctness.

See `.yaaw-core/core/project-memory.md` for the provider-neutral contract and `.yaaw-core/integrations/hindsight.md` for the Hindsight adapter.

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

Existing durable content is never overwritten. Learned-memory availability is not part of bootstrap and never blocks YAAW.

## Verification

```text
python scripts/validate_core.py
python scripts/validate_behavior.py
python scripts/behavior_oracle.py
python -m unittest discover -s tests -v
```

See `WORKFLOW.md` for the lifecycle and `.yaaw-core/core/io-contract.md`, `artifact-model.md`, `folder-ownership.md`, `authority.md`, `routing.md`, `context-loading.md`, `project-memory.md`, plus `.yaaw-core/integrations/hindsight.md` for normative contracts.
