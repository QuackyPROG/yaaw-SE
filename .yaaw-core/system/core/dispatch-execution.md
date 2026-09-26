# Dispatch execution contract

Dispatch executes exactly one already-selected semantic handoff.

## Canonical rules
1. Public skills first become durable runtime intent.
2. Orchestrator validates framework health, applies at most one reconciliation, validates source currency, and persists one exact handoff.
3. A non-Orchestrator authority executes that handoff using the active host adapter's supported isolation/profile mechanism.
4. The authority writes its durable semantic output and returns one allowed typed result.
5. Worker text is not state authority. After success, failure, interruption, or lost response, Orchestrator observes reality again before routing.

## Public invocation
Direct public invocation does not bypass Orchestrator. For example, `yaaw-implement` means desired outcome `IMPLEMENT`; missing product/planning/spec/ticket prerequisites are resolved first, and the shortcut completes at `REVIEW_REQUIRED` rather than automatically reviewing.

## Fresh-context invariant
An Implementer context never becomes the Reviewer context. A dead worker is not retried blindly; durable progress is inspected first.

## Provider boundary
Provider/model mechanics remain adapter-owned. The canonical semantic path is identical across Codex, Claude Code, Gemini CLI, and Cline.
