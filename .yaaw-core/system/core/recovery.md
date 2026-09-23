# Recovery policy

Recovery compares claimed state with observed reality and returns to the last trustworthy boundary. Resolve the workspace root first and use only root-anchored, workspace-scoped repository evidence from `.yaaw-core/system/core/execution-context.md`.

## Evidence authority
- Product intent: current accepted `product.md` revision.
- Engineering decisions: current `engineering.md` decisions and accepted non-stale specs.
- Implementation reality: repository contents plus repository identity/diff history.
- Acceptance: fresh review evidence tied to the exact ticket/spec revisions and repository identity.
- Routing cache: `state.json`, reconciled against stronger evidence.

## Rules
- Never reimplement solely because state is stale.
- `IN_PROGRESS` + implementation + required verification evidence + no review -> reconcile to `REVIEW_REQUIRED`.
- `READY` + implementation already present -> inspect/recover rather than duplicate the change.
- `PASS` + missing/stale review, source revision mismatch, or repository identity mismatch -> invalidate current PASS and route to review/replan as appropriate.
- A stale `.yaaw-core/runtime/handoff.json` is discarded, not executed.
- If repository identity is required but status is not `READY`, return `PRECONDITION_UNSATISFIED:REPOSITORY_IDENTITY_UNAVAILABLE` or `BLOCKED` with exact missing proof.
- If a dispatched worker ends unexpectedly, returns no response, loses its context, or its response is lost, treat that as an ordinary context interruption: inspect durable artifacts/repository/evidence and route from reality.
- Never blindly retry a worker that was successfully created; first determine whether it already produced durable effects.
- Do not persist host worker/session IDs into durable project memory. Replaceable coordination data, if ever required, belongs under `.yaaw-core/runtime/`.
- If the last trustworthy boundary cannot be proven, return `BLOCKED` with exact missing proof.

Every reconciliation uses a legal transition and records its reason/evidence in state provenance.
