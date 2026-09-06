# Recover interruption

## Purpose
Resume safely after context/session failure without duplicating already-completed work.

## Inputs
Active/recent artifact, state claims, runtime caches, repository identity/history/diff, verification/review evidence.

## Procedure
1. Discard stale runtime handoffs/snapshots.
2. Identify the last trustworthy completed boundary from current artifacts, repository identity/history/diff, verification evidence, and review evidence.
3. Do not use project-memory recollection as proof that work completed or a lifecycle boundary was crossed.
4. If implementation exists, prefer verification/review over reimplementation when evidence supports it.
5. Reconcile only via legal transitions with provenance.
6. If the boundary cannot be proven, return `BLOCKED` with exact missing evidence.
7. Return control to `orchestration.route` for normal next-action selection.

Never repeat destructive work merely because a context ended.
