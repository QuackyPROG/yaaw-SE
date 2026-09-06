# Inspect state

## Purpose
Create a non-mutating observed-reality snapshot that separates claims from evidence.

## Inputs
`.yaaw/state.json`, `docs/product/product.md`, `docs/engineering/engineering.md`, current specs/tickets/reviews/evidence/runtime files, project rules, and repository status/diff/log/branch.

## Preconditions
Canonical project structure has been ensured by the invoking entry workflow. Direct callers must run the idempotent project initializer first when required structure is missing.

## Procedure
1. Compute current repository identity.
2. Read machine-readable artifact metadata and active durable artifacts.
3. Compare state claims with artifact/repository/review evidence without repairing yet.
4. List inconsistencies, stale artifacts/handoffs, blockers, and candidate next states.
5. Write replaceable `.yaaw/runtime/observed-state.json` conforming to the observed-state schema.

## Output
Observed-state snapshot only; no semantic or ticket-state mutation.
