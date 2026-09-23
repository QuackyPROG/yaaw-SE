# Orchestration main loop

## Purpose
Continuously restore project reality and execute one safe canonical workflow at a time until a true stop condition.

## Progressive routing
Selection is metadata-first. Do not preload candidate target workflow bodies, templates, or expertise before `orchestration.determine-next-action` chooses exactly one workflow.

## Procedure
Repeat:
1. execute `orchestration.inspect-state`;
2. execute `orchestration.reconcile-state` when inconsistencies exist;
3. execute `orchestration.determine-next-action`;
4. if terminal/blocked/human-input stop condition is returned, stop;
5. execute `orchestration.dispatch` for the one persisted handoff;
6. require the dispatched execution to persist its artifact/state/evidence output or legal typed prerequisite/stop result;
7. whether dispatch reports success, failure, interruption, or no response, discard/validate the consumed handoff as appropriate and return to step 1 before loading another target workflow.

There is no direct `worker A result -> worker B` authority chain. Reality reconstruction always sits between authority-role dispatches.

## Loop safety
If the same repository capability/identity, state, handoff, and expected output repeat without any durable mutation/evidence change, stop as `BLOCKED` with `no_progress` rather than spinning.

## Stop conditions
Human product/engineering answer required; evidence/permission unavailable; target workflow requires repository `IDENTITY` but status is not `READY`; active host/runtime policy blocks required isolation; host requires approval for consequential action; or accepted scope is terminal `COMPLETE`.
