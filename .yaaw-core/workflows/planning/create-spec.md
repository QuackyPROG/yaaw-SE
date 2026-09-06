# Create spec

## Purpose
Materialize one implementation-ready engineering contract from a current readiness-passed frontier.

## Inputs
Exact handoff reads including current `docs/product/product.md`, `docs/engineering/engineering.md`, relevant `docs/engineering/decisions/ENG-*.md`, project rules, and repository references.

## Preconditions
Current frontier readiness is `PASS` and its product/engineering revisions still match.

## Procedure
1. Allocate the next `SPEC-NNN` and create `docs/specs/SPEC-NNN.md` from the canonical template.
2. Record metadata: revision, product revision, engineering revision, frontier ID, decision IDs, and status.
3. Write goal, repository context, boundaries, behavior, data/state, interfaces, failure modes, security, UX/accessibility, tests, observability, migration/compatibility, non-goals, risks, and acceptance conditions as relevant.
4. Source contract meaning only from current accepted product/engineering decisions/rules and verified repository context. Do not place a remembered historical claim directly into a spec; promote/verify it through the owning engineering artifact first if it matters.
5. Reference `ENG-*` decisions rather than copying planning or memory history.
6. Validate the spec against the canonical template/schema.
7. Return the exact spec path/revision to Orchestrator; do not create implementation code or choose the next role.

## Output
One current accepted `docs/specs/SPEC-NNN.md` or explicit `PRECONDITION_UNSATISFIED` / `BLOCKED` result.
