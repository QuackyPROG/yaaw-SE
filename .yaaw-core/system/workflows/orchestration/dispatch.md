# Dispatch one handoff

## Purpose
Execute exactly one already-selected canonical workflow. This file is not the orchestration loop.

## Inputs
`.yaaw-core/runtime/handoff.json` created by `orchestration.determine-next-action`.

## Procedure
1. Validate handoff schema, workflow registry entry, execution policy, role I/O, source artifact revisions, transition-sequence basis, and repository basis.
2. Enforce repository requirement: `NONE` needs no Git prerequisite; `INSPECT` may proceed with a represented `UNVERSIONED` workspace; `IDENTITY` requires repository status `READY`.
3. If any basis is stale or unsatisfied, discard the handoff and return a typed stale/prerequisite result to `orchestration.route`; do not execute it.
4. Resolve the handoff's execution-context policy from `execution-policy.json` and `.yaaw-core/system/core/dispatch-execution.md`.
5. If the target is an Orchestrator workflow or policy is `ROOT_ONLY`, execute in the current root context.
6. Otherwise request the active host adapter's isolated-worker mechanism. When isolation is available, execute this one handoff in a fresh worker with minimal bootstrap context and without relying on inherited parent conversation.
7. If isolation is unavailable or a named worker cannot be selected before child creation, follow the configured host fallback policy. If a child was already created and then failed, do **not** blindly retry; return to reality inspection first.
8. The executing context loads only the target role contract, selected workflow contract, exact handoff reads, selected expertise, and minimal relevant repository context.
9. Execute the target workflow once. A worker may not route or spawn another YAAW authority role.
10. Require the expected durable output/state/evidence or an explicit legal typed stop/prerequisite result.
11. Treat any child response only as an execution signal; do not accept it as project truth without re-inspection.
12. Mark/remove the consumed runtime handoff and return control to `orchestration.route`.

Never recursively dispatch `orchestration.dispatch` as its own target. A target role never dispatches a peer.
