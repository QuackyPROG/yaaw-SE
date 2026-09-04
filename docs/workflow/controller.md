# Deterministic controller

The controller is a policy enforcement layer around agent engineering judgment. It does **not** plan features, write product intent, or decide whether code is good. It answers narrower questions that software can answer reliably.

## What it enforces

- legal ticket-state transitions and terminal-history immutability;
- dependency graph validity, cycle detection and READY frontier calculation;
- owner/blocker/acceptance/source-freshness admission gates;
- artifact field mutation authority;
- scope checks and one-writer worktree leases;
- dispatch/repair/replan/failure-signature budgets;
- idempotent ticket mutations and explicit operation IDs;
- evidence freshness and QA/delivery admission;
- runtime/model capability floors and operating-mode strengthening;
- recovery consistency between durable ticket state and ephemeral snapshots.

## What remains judgment

Agents still decide what a task means, whether an observed behavior is actually a defect, what architecture is appropriate, which acceptance criteria capture product intent, and whether an implementation is technically sound beyond executable evidence.

A controller rejection is therefore `this action violates registered workflow policy`, not `this engineering idea is wrong`.

## Admission model

A mutating worker receives a bounded context capsule. The controller verifies the ticket is dispatchable, the owner is resolved, blockers are DONE, sources are current, the route budget permits another dispatch, and a writer lease can be acquired. Prompt text alone cannot grant mutation authority.

## Failure behavior

Illegal or contradictory state fails closed. Material discoveries return `STOP_AND_REPLAN`; only the Planner may author the corresponding `PLAN_DELTA`. Repeated identical failure signatures eventually force that escalation instead of allowing an endless repair loop.

## Operator surface

`scripts/yaaw_cli.py` exposes inspection and dry-run-first mutation/recovery commands. Durable repository state is the source of workflow truth; `.yaaw/runtime/` contains only recoverable ephemeral controller data.
