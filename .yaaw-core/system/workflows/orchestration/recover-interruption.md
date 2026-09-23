# Recover interruption

## Purpose
Resume safely after context/session failure without duplicating already-completed work.

## Inputs
Active/recent artifact, state claims, runtime caches, repository identity/history/diff, verification/review evidence.

## Procedure
1. Discard stale runtime handoffs/snapshots.
2. Identify the last trustworthy completed boundary.
3. If implementation exists, prefer verification/review over reimplementation when evidence supports it.
4. Reconcile only via legal transitions with provenance.
5. If the boundary cannot be proven, return `BLOCKED` with exact missing evidence.
6. Return control to `orchestration.route` for normal next-action selection.

Never repeat destructive work merely because a context ended.
