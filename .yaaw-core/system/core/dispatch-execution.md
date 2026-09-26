# Dispatch execution contract

Dispatch executes exactly one already-selected semantic handoff.

## Canonical rules
1. Public skills first become durable runtime intent.
2. Orchestrator validates framework health, applies at most one reconciliation, validates source currency, and persists one exact handoff.
3. A non-Orchestrator authority executes that handoff using the active host adapter's supported isolation/profile mechanism.
4. The authority writes its durable semantic output and returns one allowed typed result.
5. A worker message is an execution signal, not project truth. After success, failure, interruption, or lost response, Orchestrator observes reality again before routing.

## Public invocation
Direct public invocation does not bypass Orchestrator. For example, `yaaw-implement` means desired outcome `IMPLEMENT`; missing product/planning/spec/ticket prerequisites are resolved first, and the shortcut completes at `REVIEW_REQUIRED` rather than automatically reviewing.

## Fresh-context invariant
An orchestrated Implementer execution context must never become the Reviewer execution context for the same work. A dead worker is not retried blindly; durable progress is inspected first.

## Authority execution profile fidelity invariant
Provider/model execution selection belongs to the active host adapter, but changing execution mechanism may not silently change the configured effective authority profile.

- `HOST_INHERIT` remains symbolic; unknown inherited model/reasoning values are never guessed.
- If an execution mechanism exists but cannot guarantee the required profile, return `BLOCKED:HOST_EXECUTION_PROFILE_UNAVAILABLE`.
- If strict isolation is required and no isolated mechanism exists, return `BLOCKED:HOST_ISOLATION_UNAVAILABLE`.
- A profile/isolation stop before child creation means no authority worker ran and must not increment the execution-failure ledger.
- Implementer/Reviewer capability fallback preserves the exact semantic role and handoff and is subject to the same profile-fidelity rule.

## Provider boundary
Provider/model mechanics remain adapter-owned. The canonical semantic path is provider-neutral and identical across supported host adapters.
