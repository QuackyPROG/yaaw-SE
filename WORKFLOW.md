# YAAW Workflow

> **Agents are disposable. Artifacts are durable. Roles do work. Orchestrator decides work.**

## Entry

Every public skill enters Orchestrator and records a desired intent in `.yaaw/runtime/intent.json`. The requested skill is a destination, not a bypass.

```text
@yaaw-implement
      ↓
Orchestrator
      ↓
resolve prerequisites
      ↓
implementation when legal
      ↓
Orchestrator
      ↓
review / repair / replan / next work / COMPLETE
```

Roles never spawn peer roles. Every semantic role returns durable output plus a typed result to Orchestrator.

## Product

PRD reads the exact product/state references in its handoff and writes only:

```text
docs/product/product.md
```

If product intent is missing or needs human answers, downstream work stops until that authority is satisfied.

## Engineering planning

Planner reads the current product revision, exact engineering/spec/ticket/rule references supplied by handoff, and only repository reality needed for the planning task.

Planner writes:

```text
docs/engineering/engineering.md
docs/engineering/decisions/ENG-*.md
docs/specs/<SPEC-ID>.md
.yaaw/tickets/<SPEC-ID>/<TASK-ID>.md
docs/rules/**                 # only explicit rule promotion
```

Planner creates ticket semantic contracts as `DRAFT`; Orchestrator persists lifecycle admission to `READY` when the Planner's durable result justifies it.

## Implementation hard gate

Implementer never creates tasks for itself.

```text
no READY ticket
→ PRECONDITION_UNSATISFIED / NO_READY_TICKET
→ Orchestrator
→ accepted spec exists?
    no  → engineering ready?
            no  → Planner engineering workflow
            yes → create spec
    yes → create tickets
→ Orchestrator admits one READY ticket
→ Implementer
```

If product is missing further upstream, Orchestrator routes to PRD first.

Implementer reads one exact ticket and only its referenced upstream artifacts/rules plus admitted code context. It writes admitted source/tests and immutable evidence:

```text
.yaaw/evidence/<SPEC-ID>/<TASK-ID>-V<VERSION>.json
```

Implementer never writes product/planning/spec/ticket/review/runtime/state artifacts and never self-approves.

## Review

Reviewer receives the exact ticket/spec/product/decision/evidence identities and repository basis in the handoff. It writes only the next immutable round:

```text
.yaaw/reviews/<SPEC-ID>/<TASK-ID>/R<ROUND>.md
```

Reviewer returns exactly:

```text
PASS
REPAIR
REPLAN
BLOCKED
```

Orchestrator validates that durable review and persists the legal lifecycle transition.

## Orchestration

Orchestrator owns:

```text
.yaaw/runtime/intent.json
.yaaw/runtime/observed-state.json
.yaaw/runtime/handoff.json
.yaaw/state.json
ticket lifecycle metadata only
```

Every handoff includes exact:

```text
reads
writes
forbidden_writes
artifact revisions
repository identity
desired intent
expected results
```

A semantic role does not search for missing YAAW artifacts. It returns `PRECONDITION_UNSATISFIED`; Orchestrator resolves the prerequisite using canonical paths from `registries/artifacts.json`.

## Routing order

```text
recovery/inconsistency
→ product
→ replan
→ engineering planning
→ spec
→ tickets
→ repair
→ review
→ interruption recovery
→ READY implementation
→ next frontier
→ COMPLETE
```

For requested implementation, this naturally becomes:

```text
PRD (if needed)
→ Planner engineering (if needed)
→ Spec (if needed)
→ Tickets (if needed)
→ Implementer
→ Reviewer
→ Orchestrator decides what is next
```

The authoritative contracts are `.yaaw-core/core/io-contract.md`, `routing.md`, `folder-ownership.md`, and the machine registries under `.yaaw-core/registries/`.
