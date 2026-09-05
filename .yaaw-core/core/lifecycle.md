# Lifecycle contract

YAAW advances only through evidence-backed workflow boundaries.

```text
product missing/unready -> PRD
product ready, planning unresolved -> Planner
planning frontier ready, spec missing -> create spec
spec accepted, tickets missing -> create tickets
READY -> Implementer
IN_PROGRESS -> recover/continue only when evidence proves the boundary
REVIEW_REQUIRED -> Reviewer
REPAIR_REQUIRED -> repair same ticket -> REVIEW_REQUIRED
REPLAN_REQUIRED -> Planner
PASS -> next admitted work
frontier complete but accepted scope remains -> Planner reassesses frontier
all accepted scope complete with fresh acceptance -> COMPLETE
```

## Fresh-context invariant
Every workflow must be resumable from durable artifacts and repository evidence without previous chat history.

## Admission invariant
Implementation may begin only for a bounded `READY` ticket whose source spec/frontier is currently valid.

## Acceptance invariant
A ticket is accepted only by a fresh review tied to the exact repository identity and the current ticket/spec revisions.

## Transition invariant
Every state transition follows `core/transitions.md`, records provenance in `.yaaw/state.json`, and cites the evidence or artifact that justified it.

## Invalidation invariant
Changed product intent or engineering decisions propagate through `core/invalidation.md`; historical artifacts are preserved but stale acceptance is never treated as current.
