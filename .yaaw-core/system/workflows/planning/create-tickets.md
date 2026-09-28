# Create tickets

## Purpose
Create bounded dependency-aware implementation contracts for one current accepted spec, and re-evaluate already-registered `DRAFT` tickets when their admission prerequisites may have changed.

## Preconditions
Source spec is `ACCEPTED`, product/engineering revisions remain current, planning status is `ready` with readiness `PASS`, and repository requirement `IDENTITY` is satisfied with repository status `READY`.

## Existing-ticket rule
Before allocating any new `TASK-NNN` ID, inspect current tickets for the active spec. A current `DRAFT` is an admission candidate, not evidence that ticket creation must start over.

Never duplicate an existing ticket merely because it is still `DRAFT`.

## Procedure
1. If exact repository identity is unavailable, return `PRECONDITION_UNSATISFIED:REPOSITORY_IDENTITY_UNAVAILABLE`; do not admit executable tickets.
2. Inspect current ticket artifacts and reconciled lifecycle state for the active spec before creating anything.
3. If routing supplied a current `DRAFT` ticket, re-evaluate that ticket first.
4. A `DRAFT` may become `READY` only when:
   - its product, engineering, spec, and ticket revisions are current;
   - planning remains `ready` with readiness `PASS`;
   - every declared dependency is `PASS` in reconciled state;
   - repository identity is current and trustworthy;
   - its acceptance contract remains implementable without inventing product or engineering decisions; and
   - any explicit execution prerequisite recorded in its status rationale is currently satisfied.
5. If the contract itself must change, do not disguise that as admission. Route through `planning.replan`, revise the contract with proper revision/invalidation semantics, then reassess admission.
6. If the contract is unchanged and admission now passes, update only the ticket artifact status from `DRAFT` to `READY`. Do not rewrite history and do not increment ticket revision solely for the lifecycle admission bit.
7. If dependencies are not yet `PASS`, keep the ticket `DRAFT`. Normal orchestration should continue the prerequisite ticket rather than repeatedly invoking Planner.
8. For genuinely missing work, split the accepted spec into coherent `TASK-NNN` units sized for a fresh Implementer.
9. Apply `.yaaw-core/system/rules/changeability.md` while defining boundaries.
10. Each ticket metadata records source spec/revision, product revision, engineering decision IDs, dependencies, expertise, ticket revision, and status.
11. Body records product requirements, relevant areas, required behavior, allowed scope, non-goals, acceptance criteria, required tests, relevant engineering/changeability constraints, and a precise status rationale when left `DRAFT`.
12. Ensure supporting refactors are admitted only when necessary for safe implementation or verification.
13. Validate ticket template/metadata before returning success.

## Durable admission fact
Planner owns the semantic decision that a ticket artifact is `READY`. Planner still never writes `state.json`.

After Planner persists `DRAFT -> READY` in the current ticket artifact, Orchestrator must observe that fact, validate the legal transition and current sources/dependencies/repository identity, then adopt exactly one `TICKET_ADMISSION` reconciliation into state.

Ticket frontmatter therefore does not directly override state. It proposes a Planner-owned durable fact that Orchestrator may adopt only when the admission contract is still valid.

## Output
Dependency-aware tickets requiring no planning-chat memory, plus one of:
- newly-created current ticket artifacts;
- an existing current `DRAFT` promoted to `READY`;
- an unchanged `DRAFT` with an exact prerequisite reason; or
- a typed prerequisite/blocker/replan result.

## Registration
Planner writes ticket artifacts only. Orchestrator registers new current tickets and adopts later Planner admission facts into `state.json` one reconciliation at a time, preventing duplicate ticket creation and preventing lifecycle jumps.
