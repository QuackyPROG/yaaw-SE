# Decision frontier

## Purpose
Own the canonical partition of known decisions, current implementation frontier, product gaps, blocking external research, and future fog.

## Inputs
Current product/engineering state, repository evidence/capability, research metadata, and `.yaaw-core/system/rules/assumption-challenge.md` plus `.yaaw-core/system/rules/research-admission.md`.

## Procedure
For each candidate decision or fact:
1. Are prerequisites settled?
2. Is it materially relevant to the next bounded implementation slice?
3. Can repository evidence answer it without the human?
4. Is it a product gap that must return to PRD/human authority?
5. Is it a routine reversible Planner decision that should be resolved internally?
6. Does it contradict an accepted `ENG-*` decision or repository fact?
7. Is it based on an unsupported assumption?
8. Is an external fact genuinely required now? If so, does it have a valid research-admission basis?

Persist exactly:
- **Known decisions**: settled and reusable.
- **Current frontier**: one bounded next slice with Goal, Included scope, Explicitly deferred work, Preconditions, Repository facts, Blocking engineering decisions, Blocking external research, Product gaps, and Readiness basis.
- **Future fog**: issues dependent on later evidence.

When a material external fact blocks the frontier, allocate/update one `RSH-NNN` from the research template with its admission basis. Do not perform the research in this workflow.

Assign/update a stable frontier ID. Only current-frontier decisions/research/product gaps may block readiness.

## Output
Durable bounded frontier plus zero or more admitted research artifacts. The next route is research, question-round, PRD, readiness, or READY as the persisted partition requires.
