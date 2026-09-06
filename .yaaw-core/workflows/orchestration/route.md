# Orchestration main loop

## Purpose
Continuously restore project reality and execute one safe canonical workflow at a time until a true stop condition.

## Procedure
Before entering the loop, ensure the canonical project structure exists. If any required `docs/` or `.yaaw/` directory/artifact is missing, run the idempotent project initializer (equivalent to `python scripts/init_project.py .`) to create only missing structure without overwriting existing artifacts.

Repeat:
1. execute `orchestration.inspect-state`;
2. execute `orchestration.reconcile-state` when inconsistencies exist;
3. execute `orchestration.determine-next-action`;
4. if terminal/blocked/human-input stop condition is returned, stop;
5. execute `orchestration.dispatch` for the one persisted handoff;
6. require the dispatched workflow to persist its artifact/state/evidence output;
7. discard the consumed handoff and return to step 1.

## Loop safety
If the same repository identity, state, handoff, and expected output repeat without any durable mutation/evidence change, stop as `BLOCKED` with `no_progress` rather than spinning.

## Stop conditions
Human product/engineering answer required; evidence/permission unavailable; host requires approval for consequential action; or accepted scope is terminal `COMPLETE`.
