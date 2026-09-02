---
name: implementation
description: Implement one bounded engineering contract with preservation invariants, expected change-surface control, targeted verification, explicit stop-and-replan triggers and a diff-based handoff.
---

# Implementation

## Artifact contract

Canonical machine contract: `.agents/artifacts.json` -> `contracts.skills.implementation`.

- Read: current bounded contract, relevant PRD/ADR/spec sources, allowed/forbidden and expected change surface, preservation invariants, relevant source/tests/docs, verification seam.
- Produce: `CONTRACT_MUTATION`, `IMPLEMENTATION_HANDOFF`.
- `CONTRACT_MUTATION` means only paths authorized by the current contract and resolved owner; it is not a generic write grant.
- Durable implementation evidence belongs in the current DELIVERY ticket's registered implementation section; L0 may remain ephemeral with Git/diff as durable truth.
- Do not mutate PRD semantics, ticket graph, material acceptance, or out-of-contract paths.

## Contract gate

Do not mutate until goal, acceptance, owner, allowed/forbidden scope, **expected change surface**, **preservation invariants**, relevant sources, verification seam, stop triggers, and output artifacts are clear enough for the selected level.

Re-check contract freshness before editing: blockers still complete, referenced PRD/spec/ADR not superseded, ownership unchanged, and relevant interfaces not materially invalidated since planning.

## Execution

1. Inspect only target + immediate interfaces/tests.
2. Establish intended observable seam; use red-green-refactor when useful.
3. Make the smallest cohesive change that satisfies acceptance while preserving declared invariants.
4. Run narrow checks frequently and type/static checks as appropriate.
5. Track changed paths; use `scripts/verify_task_scope.py` for bounded low-level work when available.
6. Continuously compare actual paths/behavior with the expected change surface; explain bounded deviations rather than normalizing scope creep.
7. Avoid unrelated refactors/speculative abstractions.
8. Run final verification and inspect actual diff.
9. Confirm preservation invariants still hold.
10. Update canonical docs only for facts/decisions truly changed.
11. Checkpoint implementation evidence to its registered destination.

## Evidence qualification

Do not present suspicion as proof. Label important implementation findings as `CONFIRMED`, `SUPPORTED`, `SUSPECTED`, or `UNKNOWN`, with the reproduction/test/static/runtime evidence that justifies the label.

## Stop conditions

Return `STOP_AND_REPLAN` before expanding into a new owner/subsystem, architecture/migration decision, unapproved dependency/provider/trust boundary, destructive operation, materially different acceptance, violated preservation invariant, stale contract source, or unexpectedly broad blast radius.

If the desired product outcome itself appears wrong or impossible, escalate to human product authority; do not rewrite an accepted PRD.

## Repair

Fresh Implementer is default. One reuse is allowed for QA repair only when contract, sources, invariants, and assumptions are unchanged.
