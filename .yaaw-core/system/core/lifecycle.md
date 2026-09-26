# Lifecycle contract

YAAW advances only through durable facts adopted by Orchestrator.

```text
product missing/unready -> PRD
product ready, planning unresolved -> Planner
planning ready, spec missing -> create/adopt spec
spec accepted, tickets missing -> create/register tickets
READY -> implementation_start fact -> IN_PROGRESS
IN_PROGRESS -> PASS verification fact -> REVIEW_REQUIRED
REVIEW_REQUIRED -> immutable Reviewer result -> PASS | REPAIR_REQUIRED | REPLAN_REQUIRED | BLOCKED
REPAIR_REQUIRED -> fresh PASS verification -> REVIEW_REQUIRED
PASS + scope_status OPEN/UNKNOWN -> Planner
all current tickets PASS/CANCELLED + scope_status COMPLETE -> COMPLETE
```

One reconciliation is applied per observation cycle; recovery never jumps directly from `READY` to `REVIEW_REQUIRED`.

## Fresh-context invariant
Conversation may disappear at any point. Durable artifacts and repository evidence must still identify the correct next boundary.
