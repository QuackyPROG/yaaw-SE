# Progressive Ticket Graph

## Ticket kinds

### DISCOVERY

Question: **What is true?**

Output: bounded evidence with provenance, confidence, freshness, and unresolved unknowns. Discovery does not choose product intent.

### DECISION

Question: **What should be true?**

Output: one explicit decision, alternatives considered, constraints/evidence, consequences, approval state, and affected future work.

### DELIVERY

Question: **What bounded behavior can be implemented and verified now?**

Output: code/config/docs plus verification evidence satisfying explicit acceptance criteria.

## Dependency graph

Each ticket declares blockers. A blocker must genuinely prevent starting or accepting the ticket; do not create cosmetic chains.

The **frontier** is all open tickets whose blockers are complete and whose evidence/decisions remain current. Independent frontier discovery/read tasks may run in parallel. Parallel mutation requires isolated worktrees and non-overlapping ownership.

## Tracer-bullet delivery

Prefer narrow complete vertical slices over horizontal layer tickets. A delivery ticket should ideally be demonstrable or externally verifiable by itself and fit one fresh implementation context.

Bad decomposition:

```text
create database
create backend
create frontend
add tests
```

Better decomposition:

```text
user can create an account end-to-end
user can authenticate end-to-end
user can recover an account end-to-end
```

## Wide refactors and migrations

When a single mechanical change has a blast radius that cannot land as vertical slices, use `expand -> migrate batches -> contract`. Keep compatibility during migration when possible. If intermediate states cannot be green independently, use an explicit isolated integration branch/worktree and a final integrate-and-verify gate.

## Fog / not yet specified

L3/L4 maps intentionally hold imprecise future areas that cannot yet be phrased as a precise question or delivery outcome. Fog is not a backlog of guessed tickets.

A fog item graduates only when it can be stated precisely. Resolving frontier work may cause one fog item to become several tickets, one ticket, or disappear.

## Completed history

Closed tickets remain historical evidence. Replanning should alter unresolved work. If a completed change becomes wrong, create a corrective/reversal ticket linked to the decision/evidence that invalidated it rather than editing history to pretend it never happened.
