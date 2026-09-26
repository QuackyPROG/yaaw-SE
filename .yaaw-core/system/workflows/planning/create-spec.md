# Create specification

## Purpose
Materialize one coherent ready engineering frontier as a durable implementation contract.

## Preconditions
Current frontier readiness is `PASS`; its product/engineering revisions remain current; all blocking research is `RESOLVED`; the bounded frontier sections are complete.

## Procedure
1. Allocate the next `SPEC-NNN` and only now load/create from the canonical spec template.
2. Record metadata: revision, product revision, engineering revision, frontier ID, decision IDs, and status.
3. Write goal, repository context, boundaries, behavior, data/state, interfaces, failure modes, security, UX/accessibility, tests, observability, migration/compatibility, non-goals, risks, and acceptance conditions as relevant.
4. Reference `ENG-*` decisions and material `RSH-*` provenance rather than copying planning history.
5. Validate required metadata/sections and confirm no unresolved material decision was invented.
6. Mark spec `ACCEPTED`; otherwise leave `DRAFT`/route back to planning.

## Output
One current accepted spec or an explicit planning gap.

## Adoption
Planner writes the accepted spec only. Orchestrator detects the unique current accepted spec and adopts it into state on the next observation. Planner never writes `state.json`.
