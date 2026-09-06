# Create tickets

## Purpose
Translate one current accepted spec into bounded dependency-aware implementation contracts.

## Preconditions
Source spec is `ACCEPTED` and its product/engineering revisions remain current.

## Procedure
1. Split work into coherent `TASK-NNN` units sized for a fresh Implementer.
2. Create tickets under `.yaaw/tickets/<SPEC-ID>/TASK-NNN.md` so source ownership is visible from the filesystem.
3. Each ticket metadata records source spec/revision, product revision, engineering decision IDs, dependencies, expertise, ticket revision, and status.
4. Body records product requirements, relevant areas, required behavior, allowed scope, non-goals, acceptance criteria, and required tests.
5. Treat the ticket as the Implementer's bounded handoff contract: Planner owns contract meaning; Implementer may not silently alter scope/acceptance/architecture.
6. Validate ticket template/metadata.
7. Set `READY` only when dependencies and planning admission are satisfied; otherwise `DRAFT`.

## Output
Dependency-aware tickets that require no planning-chat memory and can be handed to fresh Implementers one at a time.
