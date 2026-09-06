# Create tickets

## Purpose
Translate one current accepted spec into bounded dependency-aware implementation contracts.

## Inputs
Exact accepted `docs/specs/<SPEC-ID>.md`, its current product/engineering decision references, relevant rules, and only repository context needed for decomposition.

## Preconditions
Source spec is `ACCEPTED` and its product/engineering revisions remain current.

## Procedure
1. Split work into coherent `TASK-NNN` units sized for a fresh Implementer.
2. Create each semantic contract at `.yaaw/tickets/<SPEC-ID>/TASK-NNN.md` with initial lifecycle status `DRAFT`.
3. Each ticket metadata records source spec/revision, product revision, engineering decision IDs, dependencies, expertise, and ticket revision.
4. Body records product requirements, relevant areas, required behavior, allowed scope, non-goals, acceptance criteria, and required tests.
5. Source ticket meaning from the accepted spec/current decisions, not directly from project memory or prior conversation. Historical context may have informed planning earlier, but the ticket must be executable without it.
6. Treat the ticket as the Implementer's bounded handoff contract: Planner owns contract meaning; Implementer may not silently alter it.
7. Validate ticket template/metadata.
8. Return which `DRAFT` tickets are admission-ready. Orchestrator alone persists legal `DRAFT -> READY` lifecycle transitions.

## Output
Dependency-aware `.yaaw/tickets/<SPEC-ID>/TASK-NNN.md` contracts plus admission results requiring no planning-chat or project-memory dependency.
