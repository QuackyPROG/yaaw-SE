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
8. Determine which `DRAFT` tickets are admission-ready. Orchestrator alone persists legal `DRAFT -> READY` lifecycle transitions.
9. After the accepted spec has been decomposed into valid tickets, optionally synchronize an in-flight learned-memory initiative according to `core/project-memory.md` and the active provider adapter. Include frontier/feature, SPEC id+revision, important `ENG-*` ids, goal/scope/non-goals, and current TASK frontier. This best-effort side effect is non-authoritative and non-blocking; failure cannot change ticket readiness/admission results.
10. Return the ticket identities and admission results to Orchestrator.

## Output
Dependency-aware `.yaaw/tickets/<SPEC-ID>/TASK-NNN.md` contracts plus admission results requiring no planning-chat or project-memory dependency.
