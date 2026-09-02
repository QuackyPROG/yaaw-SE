---
name: implementation
description: Implement one bounded engineering contract with tight scope, frequent targeted verification, explicit stop-and-replan triggers and a diff-based handoff.
---

# Implementation

## Artifact contract

Canonical machine contract: `.agents/artifacts.json` -> `contracts.skills.implementation`.

- Read: current bounded contract, allowed/forbidden scope, relevant source/tests/docs, verification seam.
- Produce: `CONTRACT_MUTATION`, `IMPLEMENTATION_HANDOFF`.
- `CONTRACT_MUTATION` means only paths authorized by the current contract and resolved owner; it is not a generic write grant.
- Durable implementation evidence belongs in the current DELIVERY ticket's registered implementation section; L0 may remain ephemeral with Git/diff as durable truth.
- Do not mutate ticket graph, material acceptance, or out-of-contract paths.

## Contract gate

Do not mutate until goal, acceptance, owner, allowed/forbidden scope, relevant sources, verification seam, stop triggers, and output artifacts are clear enough for the selected level.

## Execution

1. Inspect only target + immediate interfaces/tests.
2. Establish intended observable seam; use red-green-refactor when useful.
3. Make smallest cohesive change.
4. Run narrow checks frequently and type/static checks as appropriate.
5. Track changed paths; use `scripts/verify_task_scope.py` for bounded low-level work when available.
6. Avoid unrelated refactors/speculative abstractions.
7. Run final verification and inspect actual diff.
8. Update canonical docs only for facts/decisions truly changed.
9. Checkpoint implementation evidence to its registered destination.

## Stop conditions

Return `STOP_AND_REPLAN` before expanding into a new owner/subsystem, architecture/migration decision, unapproved dependency/provider/trust boundary, destructive operation, materially different acceptance, or unexpectedly broad blast radius.

## Repair

Fresh Implementer is default. One reuse is allowed for QA repair only when contract and assumptions are unchanged.
