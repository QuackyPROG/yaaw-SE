# Create specification

## Purpose
Materialize one coherent ready engineering frontier as a durable implementation contract.

## Preconditions
Current frontier readiness is `PASS` and its product/engineering revisions still match.

## Procedure
1. Allocate the next `SPEC-NNN` and create `docs/specs/SPEC-NNN.md` from the canonical template.
2. Record metadata: revision, product revision, engineering revision, frontier ID, decision IDs, and status.
3. Write goal, repository context, boundaries, behavior, data/state, interfaces, failure modes, security, UX/accessibility, tests, observability, migration/compatibility, non-goals, risks, and acceptance conditions as relevant.
4. Reference `ENG-*` decisions rather than copying planning history.
5. Validate required metadata/sections and confirm no unresolved material decision was invented.
6. Mark spec `ACCEPTED`; otherwise leave `DRAFT`/route back to planning.

## Output
One current accepted spec in `docs/specs/` or an explicit planning gap.
