# Lifecycle contract

The canonical lifecycle is:

```text
product missing/unready -> PRD
product ready, planning unresolved -> Planner
planning frontier ready, spec missing -> create spec
spec ready, tickets missing -> create tickets
READY ticket -> Implementer
REVIEW_REQUIRED ticket -> Reviewer
REPAIR -> repair same ticket -> review again
REPLAN -> Planner
PASS -> next READY ticket
frontier complete, accepted product scope remains -> Planner reassesses frontier
all accepted scope complete -> terminal COMPLETE
```

## Fresh-context invariant

Every workflow must be resumable from durable artifacts and repository evidence without requiring previous chat history.

## Admission invariant

Implementation may begin only for a bounded ticket in `READY` state whose source planning frontier passed readiness review.

## Acceptance invariant

A ticket is complete only when a fresh review records `PASS` against the reviewed repository state.
