# Dispatch one handoff

## Purpose
Execute exactly one already-selected canonical workflow. This file is not the orchestration loop.

## Inputs
`.yaaw-core/runtime/handoff.json` produced by the deterministic orchestration runtime.

## Procedure
1. Immediately before loading target semantics, execute:

```text
node .yaaw-core/system/tools/orchestration-runtime.mjs --workspace <WORKSPACE_ROOT> --check-handoff
```

2. Require `HANDOFF_FRESH`. `FRAMEWORK_STOP`, `RECONCILE_REQUIRED`, `ROOT_ACTION`, `TERMINAL`, `BLOCKED`, or `HANDOFF_STALE` returns control to `orchestration.route`; do not execute the stale target. This single freshness check reuses the same framework, repository-identity, artifact, routing, and handoff serialization implementation that created the handoff.
3. Resolve the handoff's execution-context policy from `execution-policy.json` and `.yaaw-core/system/core/dispatch-execution.md`.
4. If the target is an Orchestrator workflow or policy is `ROOT_ONLY`, execute in the current root context.
5. Otherwise ask the active host adapter to resolve the selected authority's required effective execution profile. This is host execution metadata; do not write provider model/reasoning identifiers into the canonical handoff.
6. Prefer the adapter's exact named authority worker when available. If named selection is unavailable before child creation, the adapter may choose a generic isolated mechanism only after proving profile equivalence or authoritatively correcting every mismatched profile dimension.
7. If an isolated mechanism exists but cannot guarantee the required profile, return `BLOCKED:HOST_EXECUTION_PROFILE_UNAVAILABLE`. If strict isolation is required and no isolated mechanism exists at all, return `BLOCKED:HOST_ISOLATION_UNAVAILABLE`.
8. In an adapter `auto` mode, inline fallback is legal only when the adapter proves the inline/root execution profile equivalent to the required authority profile. A deliberately selected adapter `inline` mode is an explicit opt-out from per-role model isolation.
9. If a child was already created and then failed, do **not** switch mechanisms or retry blindly; return to deterministic reality preparation first.
10. For Implementer or Reviewer, consult `.yaaw-core/runtime/dispatch-failures.json` only after inspection. If the unchanged handoff basis has reached the host-configured execution-failure threshold, request the configured host capability-fallback profile for this attempt. Resolve and preserve that fallback profile using the same fidelity rules. If the fallback itself already failed with no progress on this basis, return `BLOCKED:AUTHORITY_EXECUTION_FAILED`.
11. A pre-execution `HOST_EXECUTION_PROFILE_UNAVAILABLE` or `HOST_ISOLATION_UNAVAILABLE` stop does not increment the execution-failure ledger because no authority child executed.
12. The executing context loads only the target role contract, selected workflow contract, exact handoff reads, selected expertise, and minimal relevant repository context.
13. Execute the target workflow once. A worker may not route or spawn another YAAW authority role.
14. Require the expected durable output/state/evidence or an explicit legal typed stop/prerequisite result.
15. Treat any child response only as an execution signal; do not accept it as project truth without re-inspection.
16. Mark/remove the consumed runtime handoff and return control to `orchestration.route`.

Never recursively dispatch `orchestration.dispatch` as its own target. A target role never dispatches a peer.

## Package boundary
Dispatch rejects any handoff whose writes include installer-managed artifacts or `.yaaw-core/system/**`. An admitted application-file write never authorizes package framework mutation.
