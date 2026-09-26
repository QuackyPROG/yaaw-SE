# Determine next action

## Purpose
Expose the deterministic route/handoff preparation contract without duplicating routing logic in the Orchestrator model.

## Procedure
Normal orchestration satisfies this workflow by executing:

```text
node .yaaw-core/system/tools/orchestration-runtime.mjs --workspace <WORKSPACE_ROOT>
```

The runtime reads the machine routing/execution/role-I/O/handoff policies, current durable metadata, framework basis, and canonical repository identity; it then returns exactly one typed result and, only for a dispatchable non-Orchestrator semantic workflow, persists one `yaaw.handoff/v2`.

- `DISPATCH_READY`: consume the persisted handoff; do not rebuild it.
- `RECONCILE_REQUIRED`: execute only `orchestration.reconcile-state` before preparing again.
- `ROOT_ACTION`: execute only the selected Orchestrator recovery workflow.
- `TERMINAL`/`BLOCKED`/`FRAMEWORK_STOP`: write no executable handoff.

## Boundary
Do not perform target-role semantic work here. Do not hand-serialize a handoff or select expertise outside the deterministic handoff policy.

## Framework write guard
The runtime verifies selected reads/writes against `role-io.json`; an unauthorized artifact class or missing machine contract is `FRAMEWORK_CONTRACT_INCONSISTENCY`, never a semantic reroute.
