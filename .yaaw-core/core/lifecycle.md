# Lifecycle contract

YAAW advances only through evidence-backed workflow boundaries.

```text
product missing/unready -> PRD
product ready, planning unresolved -> Planner
planning ready, spec missing -> create spec
spec accepted, tickets missing -> create tickets
READY -> Implementer
IN_PROGRESS -> recovery/continue
REVIEW_REQUIRED -> Reviewer
REPAIR_REQUIRED -> Implementer repair -> REVIEW_REQUIRED
REPLAN_REQUIRED -> Planner
PASS -> next admitted work
all accepted scope current -> COMPLETE
```

## Accepted-but-stale
A historical `PASS` whose source contract is still current but whose acceptance proof is stale becomes `REVIEW_REQUIRED`, not `REPLAN_REQUIRED`.

## PASS meaning
`PASS` means the currently observed repository/worktree state satisfies the current accepted ticket contract according to an independent Reviewer.

It does not inherently mean committed, pushed, merged, or deployed. When accepted state is dirty, reporting must distinguish acceptance from persistence and disclose that the review basis is the current worktree.

## Fresh-context invariant
Every workflow must be resumable from durable artifacts and repository evidence without previous chat history.
