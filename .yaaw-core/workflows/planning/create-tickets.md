# Create tickets

## Purpose
Translate one current accepted spec into bounded dependency-aware implementation contracts.

## Preconditions
Source spec is `ACCEPTED`, product/engineering revisions remain current, and repository requirement `IDENTITY` is satisfied with repository status `READY`.

## Procedure
1. If exact repository identity is unavailable, return `PRECONDITION_UNSATISFIED:REPOSITORY_IDENTITY_UNAVAILABLE`; do not admit executable tickets.
2. Split work into coherent `TASK-NNN` units sized for a fresh Implementer.
3. Apply `.yaaw-core/rules/changeability.md` while defining boundaries.
4. Each ticket metadata records source spec/revision, product revision, engineering decision IDs, dependencies, expertise, ticket revision, and status.
5. Body records product requirements, relevant areas, required behavior, allowed scope, non-goals, acceptance criteria, required tests, and relevant engineering/changeability constraints.
6. Ensure supporting refactors are admitted only when necessary for safe implementation or verification.
7. Validate ticket template/metadata.
8. Set `READY` only when dependencies, planning admission, and repository identity are current; otherwise `DRAFT`.

## Output
Dependency-aware tickets requiring no planning-chat memory and preserving focused, reviewable change boundaries.
