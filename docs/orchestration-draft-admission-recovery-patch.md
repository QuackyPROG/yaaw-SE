# Orchestration DRAFT Admission and Recovery Patch

## Problem

A current registered ticket could remain `DRAFT` after its earlier prerequisites became satisfied. The production engine had three interacting gaps:

1. `baseRoute()` had no semantic route for registered `DRAFT` tickets and fell through to `orchestration.recover-interruption` with `NO_SAFE_SEMANTIC_ROUTE`.
2. `planning.create-tickets` could persist a ticket artifact as `READY`, but the reconciliation engine had no rule that adopted an already-registered `DRAFT -> READY` Planner fact into `state.json`.
3. `CREATE_TICKETS` intent completion treated any current ticket, including an actionable `DRAFT`, as complete. A direct create-tickets invocation could therefore terminate before Planner had a chance to reassess admission.

The result was a stable dead end: Planner owned the missing decision, the durable ticket existed, dependencies could become satisfied, but Orchestrator repeatedly selected recovery or declared the ticket operation complete.

## Required invariant

`DRAFT` remains non-executable. The fix is a legal planning/adoption path, not a weaker gate.

```text
registered current DRAFT
        |
        | dependencies PASS and no higher-priority runnable lifecycle work
        v
planning.create-tickets
        |
        | Planner validates current sources/readiness/repository/prerequisites
        v
ticket artifact status READY
        |
        | Orchestrator validates legal DRAFT -> READY adoption
        v
TICKET_ADMISSION reconciliation
        |
        v
state ticket READY
        |
        v
implementation.implement-ticket
```

Planner owns admission meaning. Orchestrator remains the only physical writer of project state.

## Routing precedence

The engine preserves existing continuation work before asking Planner to admit another draft:

1. project blocker;
2. product work;
3. `REPLAN_REQUIRED`;
4. planning readiness;
5. accepted spec;
6. ticket creation when no current tickets exist;
7. `REPAIR_REQUIRED`;
8. `REVIEW_REQUIRED`;
9. `IN_PROGRESS` recovery/verification;
10. runnable `READY` ticket;
11. dependency-satisfied `DRAFT` -> Planner admission;
12. blocked ticket;
13. terminal current frontier;
14. remaining non-actionable drafts -> Planner route for dependency/contract diagnosis;
15. unsupported lifecycle state -> typed blocker.

This ordering prevents a downstream `DRAFT` from preempting its runnable prerequisite.

## Admission reconciliation

New reconciliation fact: `TICKET_ADMISSION`.

It is considered only when all of the following are true:

- state currently says `DRAFT`;
- the current ticket artifact says `READY`;
- ticket product/engineering/spec revisions are current;
- planning status is `ready`;
- planning readiness is `PASS`;
- every declared dependency is `PASS`;
- repository identity is `READY`;
- the transition registry still defines `DRAFT -> READY` as Planner-owned through `planning.create-tickets`.

If any condition is false, Orchestrator does not adopt the artifact status.

The reconciliation is intentionally placed after new-ticket registration and before implementation/review evidence adoption.

## Why ticket frontmatter is not made authoritative

The ticket artifact is semantic evidence, not the lifecycle ledger. Blindly mirroring artifact status into state would let stale or malformed artifacts bypass lifecycle gates.

The guarded adoption is:

```text
artifact says READY
      +
current contract
      +
planning PASS
      +
dependencies PASS
      +
repository identity READY
      +
legal Planner admission transition
      =
one TICKET_ADMISSION state transition
```

## Recovery semantics

`orchestration.recover-interruption` is now interruption-only.

It is not selected for:

- ordinary `DRAFT` admission;
- missing planning admission;
- dependency-blocked drafts;
- OPEN/UNKNOWN next-frontier planning;
- direct Review/Repair shortcut precondition failures.

The generic `NO_SAFE_SEMANTIC_ROUTE -> recover-interruption` fallback is removed. Remaining planning-shaped states route to Planner; unsupported lifecycle values fail closed with a typed blocker.

## Direct create-tickets behavior

A `CREATE_TICKETS` intent is no longer complete merely because a current ticket exists.

If a current `DRAFT` has all dependencies `PASS`, the intent remains active and `planning.create-tickets` is legal. Dependency-blocked drafts do not keep create-tickets artificially open; their prerequisite lifecycle work proceeds first.

## Handoff changes

`planning.create-tickets` now reads `ticket` in addition to product/engineering/spec/repository/state context. A Planner admission handoff therefore contains the existing target ticket instead of forcing rediscovery or duplicate ticket creation.

No new role or workflow authority is introduced.

## Regression coverage

The patch covers:

- actionable registered `DRAFT` routes to `planning.create-tickets`, not recovery;
- Planner artifact `DRAFT -> READY` produces exactly one `TICKET_ADMISSION` reconciliation;
- after admission reconciliation, next route is `implementation.implement-ticket`;
- a runnable prerequisite `READY` ticket takes precedence over its downstream dependency-blocked `DRAFT`;
- `CREATE_TICKETS` intent remains active while actionable draft admission exists;
- Review shortcut precondition failure is typed and does not misuse interruption recovery;
- runtime handoff for draft reassessment includes the existing ticket reference.

## Non-goals

This patch does not make `DRAFT` executable, let Orchestrator author Planner decisions, infer `scope_status: COMPLETE`, bypass repository identity, auto-pass dependencies, add a second routing engine, let ticket frontmatter blindly overwrite state, or change review/verification acceptance rules.

## Expected reported-scenario flow

Given `TASK-001..005 = PASS`, `TASK-006 = DRAFT`, `TASK-007 = DRAFT`, TASK-006 dependencies PASS, TASK-007 depends on TASK-006, planning ready/PASS, accepted spec, and repository identity READY:

```text
TASK-006 DRAFT + dependencies PASS
  -> planning.create-tickets(TASK-006)
  -> Planner rechecks admission prerequisites
  -> TASK-006 artifact READY
  -> TICKET_ADMISSION
  -> TASK-006 state READY
  -> implementation.implement-ticket(TASK-006)
  -> verification
  -> review
  -> PASS
  -> TASK-007 is now dependency-satisfied DRAFT
  -> planning.create-tickets(TASK-007)
  -> TICKET_ADMISSION
  -> implementation...
```

Ordinary `DRAFT` handling must never select `orchestration.recover-interruption`.
