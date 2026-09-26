# Orchestration main loop

## Purpose
Continuously restore project reality and execute one safe canonical workflow at a time until a true stop condition.

## Deterministic preparation
Normal routing uses one command per basis:

```text
node .yaaw-core/system/tools/orchestration-runtime.mjs --workspace <WORKSPACE_ROOT>
```

This command performs framework integrity, canonical repository identity, durable metadata inspection, route selection, and handoff construction together. Do not separately reconstruct those stages in shell/Python/model reasoning.

## Procedure
Repeat:
1. run deterministic preparation once;
2. on `FRAMEWORK_STOP`, invalidate executable handoffs and stop with the typed framework failure;
3. on `RECONCILE_REQUIRED`, execute `orchestration.reconcile-state` only, then return to step 1;
4. on `ROOT_ACTION`, execute the returned Orchestrator workflow only, then return to step 1;
5. on `TERMINAL` or `BLOCKED`, stop;
6. on `DISPATCH_READY`, execute `orchestration.dispatch` for the persisted handoff;
7. require the dispatched execution to persist its authorized durable output or legal typed prerequisite/stop result;
8. whether dispatch reports success, failure, interruption, or no response, return to step 1 before another semantic workflow.

`orchestration.inspect-state` and `orchestration.determine-next-action` remain canonical compatibility/debug workflows, but the normal loop does not execute them as separate model-driven reconstruction passes.

There is no direct `worker A result -> worker B` authority chain. Reality reconstruction always sits between authority-role dispatches.

## Loop safety
If the same repository basis, lifecycle state, route, and expected output repeat without durable mutation/evidence change, stop as `BLOCKED` with `no_progress` rather than spinning.

## Stop conditions
Framework integrity unavailable/unhealthy; framework contract inconsistency; Human product/engineering answer required; evidence/permission unavailable; target workflow requires repository `IDENTITY` but status is not `READY`; active host/runtime policy blocks required isolation/profile fidelity; host requires approval for consequential action; or accepted scope is terminal `COMPLETE`.
