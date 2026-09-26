# Orchestration main loop

## Purpose
Continuously restore project reality and execute one safe canonical workflow at a time until the active intent is satisfied or a real stop occurs.

## Deterministic preparation
For normal continuation:
```text
node .yaaw-core/system/tools/orchestration-runtime.mjs --workspace <WORKSPACE_ROOT>
```

For a public shortcut:
```text
node .yaaw-core/system/tools/orchestration-runtime.mjs --workspace <WORKSPACE_ROOT> --invoke-skill <skill-id>
```

## Procedure
Repeat:
1. run deterministic preparation once;
2. on `FRAMEWORK_STOP`, stop without lifecycle mutation;
3. on `RECONCILE_REQUIRED`, apply exactly one reconciliation with `--reconcile-one`, then observe again;
4. on `ROOT_ACTION`, execute only the returned Orchestrator recovery workflow, then observe again;
5. on `DISPATCH_READY`, execute exactly the persisted handoff once;
6. after any worker outcome or disappearance, discard worker text as authority and observe durable reality again;
7. on `INTENT_COMPLETE`, `TERMINAL`, `BLOCKED`, or human input, stop.

No worker-to-worker authority chain exists. Every semantic successor is selected after reality reconstruction.
