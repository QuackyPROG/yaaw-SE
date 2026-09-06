# Create tickets

## Purpose
Translate one current accepted spec into bounded dependency-aware implementation contracts.

## Preconditions
Source spec is `ACCEPTED` and its product/engineering revisions remain current.

## Procedure
1. Split work into coherent `TASK-NNN` units sized for a fresh Implementer.
2. Apply `.yaaw-core/rules/changeability.md` while defining boundaries. Encode only changeability constraints that are materially relevant to the ticket; do not turn stylistic preferences or speculative refactors into requirements.
3. Each ticket metadata records source spec/revision, product revision, engineering decision IDs, dependencies, expertise, ticket revision, and status.
4. Body records product requirements, relevant areas, required behavior, allowed scope, non-goals, acceptance criteria, required tests, and relevant engineering/changeability constraints when needed.
5. Ensure scope remains focused: supporting refactors are admitted only when necessary for safe implementation or verification of the ticket behavior; unrelated cleanup remains outside the ticket.
6. Validate ticket template/metadata.
7. Set `READY` only when dependencies and planning admission are satisfied; otherwise `DRAFT`.

## Output
Dependency-aware tickets that require no planning-chat memory and preserve focused, reviewable change boundaries.
