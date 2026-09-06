# Inspect state

## Purpose
Create a non-mutating observed-reality snapshot that separates claims from evidence.

## Inputs
Canonical paths from `registries/artifacts.json`; `.yaaw/state.json`; `.yaaw/runtime/intent.json` when present; active durable artifacts; project rules; and repository status/diff/log/branch.

## Procedure
1. Direct callers must run the idempotent project initializer first; normal Orchestrator entry already guarantees this before inspection.
2. Compute current repository identity.
3. Resolve current artifact identities through `registries/artifacts.json`; do not guess alternate locations.
4. Read machine-readable artifact metadata and only the semantic bodies needed to determine current references/status.
5. Compare state claims with artifact/repository/review/evidence reality without repairing yet.
6. List inconsistencies, missing prerequisites, stale artifacts/handoffs, blockers, and candidate next states.
7. Write replaceable `.yaaw/runtime/observed-state.json` conforming to the observed-state schema.

## Output
Observed-state snapshot only; no semantic or ticket-state mutation.
