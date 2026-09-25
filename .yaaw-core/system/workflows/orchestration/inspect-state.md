# Inspect state

## Purpose
Create a non-mutating observed-reality snapshot that separates claims from evidence and classifies repository capability safely.

## Inputs
Resolved workspace root, installation manifest/framework-integrity result, `.yaaw-core/project/state.json`, product/engineering/research/spec/ticket/review/evidence/runtime files, project rules, and available repository/application reality.

## Procedure
1. Resolve `WORKSPACE_ROOT` using `.yaaw-core/system/core/execution-context.md`; never trust ambient CWD.
2. Execute `.yaaw-core/system/tools/framework-integrity.mjs --workspace <WORKSPACE_ROOT>` and record its status plus current manifest basis. If status is not `HEALTHY`, record the framework failure, invalidate any executable handoff candidate, write only the replaceable observation when safe, and stop inspection before semantic project reconciliation.
3. Probe Git only with root-anchored commands such as `git -C <WORKSPACE_ROOT> rev-parse --show-toplevel`.
4. Classify repository status using `.yaaw-core/system/rules/repository-identity.md`. A failed `rev-parse` becomes `UNVERSIONED` or another explicit status; do not leak a raw Git fatal error as successful identity.
5. When status is `READY`, compute workspace-scoped repository identity. If Git root is an ancestor, scope status/diff/untracked hashing to the workspace.
6. Read machine-readable artifact metadata and active durable artifacts.
7. Compare state claims with artifact/repository/review evidence without repairing yet.
8. Reconcile the replaceable dispatch-failure ledger. For Implementer/Reviewer worker execution failures, compare the prior failure basis with the current role, workflow, active artifact, revisions, transition sequence, and repository basis. Increment only when the prior attempt made no durable progress and the basis is unchanged. Reset/remove the ledger after legal workflow completion, durable progress, a basis change, or when routing leaves that work item.
9. List inconsistencies, stale artifacts/handoffs, blockers, and candidate next states.
10. Write replaceable `.yaaw-core/runtime/observed-state.json` conforming to observed-state v2.

## Output
Observed-state snapshot only; no semantic or ticket-state mutation.
