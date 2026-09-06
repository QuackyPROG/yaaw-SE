# YAAW Workflow

> **Agents are disposable. Artifacts are durable. Memory is advisory. Roles do work. Orchestrator decides work.**

## Entry

Every public skill enters Orchestrator and records a desired intent in `.yaaw/runtime/intent.json`. The requested skill is a destination, not a bypass.

```text
@yaaw-implement
      ↓
Orchestrator
      ↓
resolve prerequisites
      ↓
exact handoff + role context policy
      ↓
implementation when legal
      ↓
Orchestrator
      ↓
review / repair / replan / next work / COMPLETE
```

Roles never spawn peer roles. Every semantic role returns durable output plus a typed result to Orchestrator.

## Context and project memory

Every dispatch contains the exact authoritative reads/writes plus a `context_policy` copied from `.yaaw-core/registries/context-policy.json`.

Normal role startup is:

```text
read exact handoff
→ load exact authoritative references
→ focused project-memory retrieval when policy allows
→ verify current files/evidence that matter
→ broaden repository exploration only if a gap remains
→ execute workflow
```

Project memory is optional and advisory. Hindsight is the reference provider, but YAAW remains provider-neutral and must work when memory is absent. Search curated knowledge first; read a page only when needed; use deep historical reflection only when policy allows and the shallow path is insufficient.

Orchestrator never uses semantic memory to route/reconcile. Reviewer performs primary acceptance/evidence inspection before memory. Memory never supplies lifecycle evidence or `PASS`.

## Product

PRD reads the exact product/state references in its handoff and writes only:

```text
docs/product/product.md
```

When memory is enabled, PRD may search prior product discussions before asking the human to repeat context, but remembered material is not accepted intent until current human/product authority supports it.

If product intent is missing or needs human answers, downstream work stops until that authority is satisfied.

## Engineering planning

Planner reads the current product revision, exact engineering/spec/ticket/rule references supplied by handoff, and only repository reality needed for the planning task.

Before broad repository rediscovery, Planner may use project memory to retrieve component maps, conventions, historical decisions, initiatives, and rejected approaches, then verifies anything material against current code/artifacts.

Planner writes:

```text
docs/engineering/engineering.md
docs/engineering/decisions/ENG-*.md
docs/specs/<SPEC-ID>.md
.yaaw/tickets/<SPEC-ID>/<TASK-ID>.md
docs/rules/**                 # only explicit rule promotion
```

Planner creates ticket semantic contracts as `DRAFT`; Orchestrator persists lifecycle admission to `READY` when the Planner's durable result justifies it. Specs/tickets are sourced from current accepted authority, never directly from remembered history.

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

Implementer reads one exact ticket and only its referenced upstream artifacts/rules plus admitted code context. After understanding that authoritative contract, focused project memory may be used before broad code archaeology to recover conventions/rationale/previous fixes, but current code must be verified before edits and memory cannot alter scope.

Implementer writes admitted source/tests and immutable evidence:

```text
.yaaw/evidence/<SPEC-ID>/<TASK-ID>-V<VERSION>.json
```

Implementer never writes product/planning/spec/ticket/review/runtime/state artifacts and never self-approves.

## Review

Reviewer receives the exact ticket/spec/product/decision/evidence identities and repository basis in the handoff. It first inspects the current contract, diff, repository, tests, and evidence independently. Only after that primary review may it consult project memory for ambiguous historical rationale.

It writes only the next immutable round:

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

Memory can never justify `PASS`. Orchestrator validates the durable review and persists the legal lifecycle transition.

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
context policy
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

The authoritative contracts are `.yaaw-core/core/io-contract.md`, `routing.md`, `folder-ownership.md`, `context-loading.md`, `project-memory.md`, and the machine registries under `.yaaw-core/registries/`.
