# Create tickets

## Purpose
Translate one current accepted spec into bounded dependency-aware implementation contracts.

## Preconditions
Source spec is `ACCEPTED` and its product/engineering revisions remain current.

## Procedure
1. Split work into coherent `TASK-NNN` units sized for a fresh Implementer.
2. Each ticket metadata records source spec/revision, product revision, engineering decision IDs, dependencies, expertise, ticket revision, and status.
3. Body records product requirements, relevant areas, required behavior, allowed scope, non-goals, acceptance criteria, and required tests.
4. Validate ticket template/metadata.
5. Set `READY` only when dependencies and planning admission are satisfied; otherwise `DRAFT`.

## Output
Dependency-aware tickets that require no planning-chat memory.
