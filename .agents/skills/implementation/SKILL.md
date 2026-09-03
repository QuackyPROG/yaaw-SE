# implementation

## Purpose

Procedure for one controller-admitted DELIVERY contract.

## Artifact contract

Resolve `.agents/artifacts.json` and `.agents/authority.json`. Procedure may produce `CONTRACT_MUTATION` and `IMPLEMENTATION_HANDOFF`; field/path permissions remain authoritative.

## Algorithm

1. Validate the structured handoff and current source fingerprints before editing.
2. Inspect the smallest implementation neighborhood: target seam, callers/contracts, relevant tests and canonical docs.
3. Re-run the all-local scope gate before mutation when the worktree is not clean; unexpected existing writes are a blocker.
4. Implement the smallest cohesive behavior that satisfies observable acceptance; do not introduce speculative abstraction or unrelated cleanup.
5. Run the narrowest risk-bearing verification first, then domain-pack checks required by changed paths/risk tags.
6. Inspect committed/staged/unstaged/untracked changed paths against allowed/forbidden scope and compare actual versus expected surface.
7. Verify preservation invariants and document deviations with evidence.
8. If a stop trigger becomes true, stop immediately and return `STOP_AND_REPLAN` with the minimum discriminating evidence.
9. Otherwise return structured changed paths, behavior, verification records (command/environment/commit/exit result), remaining risks and documentation impact.

## Repair

A repair is a new bounded attempt by default. Reuse the same Implementer context at most once only when the contract and source fingerprints are unchanged and QA findings are precise. Controller budgets terminate repeated failure signatures.
