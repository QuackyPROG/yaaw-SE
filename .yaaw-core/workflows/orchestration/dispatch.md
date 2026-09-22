# Dispatch one handoff

## Purpose
Execute exactly one already-selected canonical workflow. This file is not the orchestration loop.

## Inputs
`.yaaw-core/runtime/handoff.json` created by `orchestration.determine-next-action`.

## Procedure
1. Validate handoff schema, workflow registry entry, execution policy, role I/O, source artifact revisions, transition-sequence basis, and repository basis.
2. Enforce repository requirement: `NONE` needs no Git prerequisite; `INSPECT` may proceed with a represented `UNVERSIONED` workspace; `IDENTITY` requires repository status `READY`.
3. If any basis is stale or unsatisfied, discard the handoff and return a typed stale/prerequisite result to `orchestration.route`; do not execute it.
4. Only now load the target role contract, selected workflow contract, exact handoff reads, selected expertise, and minimal relevant repository context.
5. Execute the target workflow once.
6. Require its expected durable output/state/evidence or an explicit typed stop/prerequisite result.
7. Mark/remove the consumed runtime handoff and return control to `orchestration.route`.

Never recursively dispatch `orchestration.dispatch` as its own target. A target role never dispatches a peer.
