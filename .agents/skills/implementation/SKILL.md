---
name: implementation
description: Implement one bounded engineering contract with tight scope, frequent targeted verification, explicit stop-and-replan triggers and a diff-based handoff.
---

# Implementation

## Contract gate

Do not start mutation until goal, acceptance, owner, allowed/forbidden scope, relevant sources, verification seam, and stop triggers are clear enough for the selected level.

## Execution

1. Inspect only target + immediate interfaces/tests needed to understand the change.
2. Establish the intended observable seam; use red-green-refactor when a useful automated seam exists.
3. Make the smallest cohesive change.
4. Run narrow checks frequently and type/static checks as appropriate.
5. Track changed paths against the contract; run `scripts/verify_task_scope.py` for low-level bounded work when available.
6. Avoid unrelated refactors/speculative abstractions.
7. Run required final verification and inspect the actual diff.
8. Update canonical docs only for facts/decisions truly changed.
9. Return evidence, not confidence.

## Stop conditions

Return `STOP_AND_REPLAN` before expanding into a new owner/subsystem, architecture/migration decision, unapproved dependency/provider/trust boundary, destructive operation, materially different acceptance, or unexpectedly broad blast radius.

## Repair

A fresh Implementer is default. One reuse is allowed for QA repair only when the contract and assumptions are unchanged.
