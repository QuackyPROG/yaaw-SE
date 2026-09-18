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
6. Do not query or use project memory as observed-state evidence. Memory is advisory historical context and is deliberately excluded from routing/reconciliation truth.
7. List inconsistencies, missing prerequisites, stale artifacts/handoffs, blockers, and candidate next states.
8. Write replaceable `.yaaw/runtime/observed-state.json` conforming to the observed-state schema.

## Output
Observed-state snapshot only; no semantic or ticket-state mutation.

## Project VCS observations

When project mode is active, also inspect and persist operational facts in `.yaaw/runtime/vcs-observed.json`: project policy health, current/integration branch, publishable dirtiness/digest, protected staged paths, upstream presence, pending checkpoint candidates, outgoing contamination, hook health, and remote-policy conflicts. These are observed facts only; they do not create semantic authority.

A non-integration local topic/worktree branch with an upstream is a VCS policy violation.
