# Decision frontier

## Purpose
Prevent giant-planner behavior by separating what is known, answerable now, and legitimately unknown.

## Inputs
Current product/engineering state and repository evidence.

## Procedure
Partition planning state into:
- **Known decisions**: settled and reusable;
- **Current frontier**: material decisions answerable now that block the next implementation slice;
- **Future fog**: questions dependent on future implementation/evidence.

Assign/update a stable frontier ID in engineering metadata. Only current-frontier decisions may block readiness for the next slice.

## Output
Updated frontier/fog and the bounded scope subject to readiness review.
