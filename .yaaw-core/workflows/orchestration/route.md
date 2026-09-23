# Orchestration main loop

## Purpose
Continuously restore project reality and execute one safe canonical workflow at a time until a true stop condition.

## Progressive routing
Selection is metadata-first. Do not preload candidate target workflow bodies, templates, or expertise before `orchestration.determine-next-action` chooses exactly one workflow.

## Procedure
Repeat:
1. execute `orchestration.inspect-state`;
2. if framework integrity is not `HEALTHY`, invalidate executable handoffs and stop with the typed framework failure; do not reconcile project lifecycle state;
3. execute `orchestration.reconcile-state` when project inconsistencies exist;
4. execute `orchestration.determine-next-action`;
5. if terminal/blocked/human-input/framework stop condition is returned, stop;
6. execute `orchestration.dispatch` for the one persisted handoff;
7. require the dispatched workflow to persist its authorized durable output or typed prerequisite result;
8. discard the consumed handoff and return to step 1 before loading another target workflow.

## Loop safety
If the same repository capability/identity, state, handoff, and expected output repeat without any durable mutation/evidence change, stop as `BLOCKED` with `no_progress` rather than spinning.

## Stop conditions
Framework integrity unavailable/unhealthy; framework contract inconsistency; Human product/engineering answer required; evidence/permission unavailable; target workflow requires repository `IDENTITY` but status is not `READY`; host requires approval for consequential action; or accepted scope is terminal `COMPLETE`.

## Cause routing

Route stable invalidation cause IDs through `registries/routing-policy.json`. Do not infer a semantic replan from free-form repository-drift prose.
