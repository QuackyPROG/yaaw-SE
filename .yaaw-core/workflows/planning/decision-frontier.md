# Decision frontier

## Purpose
Prevent giant-planner behavior by separating what is known, answerable now, and legitimately unknown.

## Inputs
Current product/engineering state, repository evidence, and `.yaaw-core/rules/assumption-challenge.md`.

## Procedure
Before partitioning each candidate decision, apply the assumption-challenge rule and ask:
1. Are its prerequisites settled?
2. Is it materially relevant to the next implementation slice?
3. Can repository evidence answer it without the human?
4. Is it actually a product gap that must return to PRD/human authority?
5. Is it only a routine reversible Planner decision that should be resolved internally?
6. Does it contradict an accepted `ENG-*` decision or repository fact?
7. Is the apparent decision based on an unsupported assumption?

Then preserve the three-way partition exactly:
- **Known decisions**: settled and reusable;
- **Current frontier**: material decisions answerable now that block the next implementation slice;
- **Future fog**: questions dependent on future implementation/evidence.

Assign/update a stable frontier ID in engineering metadata. Only current-frontier decisions may block readiness for the next slice. Dependent questions with unsettled prerequisites remain outside the current frontier.

## Output
Updated known decisions/frontier/fog and the bounded scope subject to readiness review.
