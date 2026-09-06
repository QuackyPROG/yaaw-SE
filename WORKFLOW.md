# YAAW Workflow

This document describes the canonical project flow and the handoffs between roles.

> **Agents are disposable. Artifacts are durable.**

## 1. Product definition

The Human / PRD role owns product intent.

It writes:

```text
docs/product/product.md
```

This file defines what should exist: users, behavior, scope, non-goals, constraints, and unresolved product questions. It should not become the engineering architecture document.

When product intent is sufficiently clear, Planner takes over.

## 2. Engineering discovery

Planner reads the product definition, relevant repository reality, project rules, and existing engineering context.

Planner writes durable engineering understanding to:

```text
docs/engineering/engineering.md
```

This is where engineering decisions, assumptions, risks, current decision frontier, future fog, and readiness live. Important decisions use `ENG-*` identities and may be expanded under:

```text
docs/engineering/decisions/
```

Accepted engineering decisions must be durable before the planning context disappears.

## 3. Readiness

Planner asks:

> Could a fresh Implementer execute the next slice without inventing a material product or architecture decision?

If no, planning continues. If yes, readiness is `PASS` and Planner may create the implementation spec.

## 4. Specification

Planner creates an accepted spec under:

```text
docs/specs/SPEC-NNN.md
```

The spec is the coherent engineering contract for one implementation slice. It references product and engineering revisions/decisions and defines the larger technical boundary.

## 5. Ticket creation

After the spec is accepted, **Planner creates tickets from that spec**.

```text
docs/specs/SPEC-007.md
        ↓
Planner decomposes work
        ↓
.yaaw/tickets/SPEC-007/
├── TASK-031.md
├── TASK-032.md
└── TASK-033.md
```

A ticket is the primary bounded handoff to a fresh Implementer.

A ticket contains enough execution context to define:

- goal
- source spec/revision
- relevant product requirements
- relevant `ENG-*` decisions
- dependencies
- relevant files/areas
- required behavior
- allowed scope
- explicit non-goals
- acceptance criteria
- required tests
- expertise hints

Planner owns the ticket's semantic contract. Once `READY`, Implementer may not silently redefine scope, architecture, acceptance criteria, or requirements.

## 6. Implementation

Implementer selects exactly one admitted `READY` ticket.

Its execution context is:

```text
TASK
+ referenced SPEC sections
+ referenced engineering decisions
+ relevant product constraints
+ relevant project rules/expertise
+ relevant repository code
```

Implementer owns:

- source changes within admitted scope
- tests required by the contract
- verification evidence

Verification evidence belongs under:

```text
.yaaw/evidence/<SPEC-ID>/TASK-NNN.json
```

Implementer does not self-approve.

If implementation is correct and required verification exists, the ticket advances toward `REVIEW_REQUIRED`.

If implementation reveals that the ticket/spec architecture is invalid, the correct outcome is `REPLAN_REQUIRED`, not silent contract rewriting.

## 7. Review

Reviewer independently evaluates the implementation against the ticket contract and its referenced upstream artifacts.

Reviewer writes immutable review rounds:

```text
.yaaw/reviews/SPEC-007/TASK-031/R1.md
.yaaw/reviews/SPEC-007/TASK-031/R2.md
```

Reviewer returns exactly one of:

```text
PASS
REPAIR
REPLAN
BLOCKED
```

- **PASS** — implementation satisfies the current contract.
- **REPAIR** — contract is valid; implementation has a defect.
- **REPLAN** — engineering/ticket contract is invalid or incomplete.
- **BLOCKED** — required information/evidence/access is missing.

Review history is append-only. A later review does not rewrite an earlier round.

## 8. Orchestration

Orchestrator continuously asks:

> Given durable artifacts and repository reality, what is the one correct next workflow?

It owns:

```text
.yaaw/state.json
.yaaw/runtime/**
ticket lifecycle coordination
```

It does not own product intent, engineering meaning, implementation, or acceptance.

Examples:

```text
product missing
→ PRD

product ready, engineering discovery incomplete
→ Planner

readiness PASS, no accepted spec
→ create spec

accepted spec, no tickets
→ Planner creates tickets

TASK READY
→ Implementer

TASK REVIEW_REQUIRED
→ Reviewer

TASK REPAIR_REQUIRED
→ Implementer repair

TASK REPLAN_REQUIRED
→ Planner

TASK PASS + next READY ticket
→ next Implementer
```

## 9. Ownership model

The folder map encodes authority:

```text
Human / PRD
  writes docs/product/**

Planner
  writes docs/engineering/**
  writes docs/specs/**
  authors .yaaw/tickets/** contracts

Implementer
  writes admitted application code/tests
  writes .yaaw/evidence/**

Reviewer
  writes .yaaw/reviews/**

Orchestrator
  writes .yaaw/runtime/**
  writes .yaaw/state.json
  manages ticket lifecycle metadata
```

The central invariant is:

> **Planner owns ticket content. Orchestrator owns ticket lifecycle. Implementer owns execution. Reviewer owns acceptance.**

No downstream role silently rewrites an upstream semantic contract. Invalid contracts are returned to their owner.

## 10. Recovery

State files are useful but reconstructable. Repository reality and durable artifacts are evidence.

Example:

```text
state says TASK-031 = IN_PROGRESS
implementation exists
required evidence exists
review does not exist
```

Orchestrator should reconcile to the review path rather than implementing the ticket again.

Likewise, an old `PASS` loses current authority when source revisions or repository identity no longer match.

## Full chain

```text
docs/product/product.md
        ↓
Planner engineering discovery
        ↓
docs/engineering/engineering.md
        ↓
readiness PASS
        ↓
docs/specs/SPEC-NNN.md
        ↓
Planner ticket decomposition
        ↓
.yaaw/tickets/<SPEC-ID>/TASK-NNN.md
        ↓
Implementer
        ↓
code + tests + evidence
        ↓
Reviewer
        ↓
PASS / REPAIR / REPLAN / BLOCKED
        ↓
Orchestrator routes next valid workflow
```

The authoritative folder/write rules live in `.yaaw-core/core/folder-ownership.md`.
