# Dispatch execution contract

Dispatch is a semantic request to execute exactly one already-selected YAAW handoff using the strongest context-isolation mechanism the active host can safely provide.

## Canonical rules
1. Orchestrator selects exactly one canonical workflow.
2. Orchestrator persists one valid `.yaaw-core/runtime/handoff.json`.
3. Under orchestrated operation, a non-Orchestrator semantic role should execute in a fresh isolated worker when the host provides that capability.
4. The worker receives minimal bootstrap context: workspace root, semantic role, handoff path, and instructions to resolve the canonical role/workflow from YAAW registries.
5. The worker reads durable YAAW state instead of depending on inherited planning conversation.
6. One dispatch executes exactly one handoff.
7. A worker may not route, spawn, or command another YAAW authority role.
8. The worker persists the required durable artifact/state/evidence before returning.
9. The worker returns only a legal typed result from the handoff/workflow contract.
10. A worker message is an execution signal, not project truth.
11. After worker completion, failure, interruption, or lost response, Orchestrator re-enters `orchestration.inspect-state` before selecting another semantic workflow.
12. If the preferred execution mechanism is unavailable, the active host adapter may use an alternate mechanism only when it can preserve the configured effective authority execution profile; otherwise dispatch fails closed.

## Direct invocation
A user who directly invokes PRD, Planner, Implementer, or Reviewer has intentionally selected that role/workflow and may execute it in the current context. Isolation policy here governs **Orchestrator dispatch**, not the existence of direct public entrypoints.

## Execution-context policy
`.yaaw-core/system/registries/execution-policy.json` declares one of:
- `ROOT_ONLY`: run in the active root Orchestrator context.
- `ISOLATED_PREFERRED`: prefer a fresh worker; host fallback may run through another mechanism only when the adapter establishes execution-profile equivalence. A deliberately selected host `inline` mode is an explicit opt-out from per-role isolation.
- `INLINE_ALLOWED`: current-context execution is explicitly acceptable.

A future `ISOLATED_REQUIRED` value may be introduced only with a schema/version update. Host adapters may still expose a stricter local runtime mode that blocks instead of falling back.

## Fresh-context invariant
An orchestrated Implementer execution context must never become the Reviewer execution context for the same work. Reviewer acceptance is an independent dispatch.

## Failure and retry invariant
If a worker started and later failed or disappeared, do not blindly start the same authority worker again. Inspect durable reality first because the worker may already have mutated the repository or written evidence.

## Capability fallback invariant
For Implementer and Reviewer only, a host adapter may declare a bounded capability fallback after repeated **execution** failures. This is not a semantic reroute.

The Orchestrator owns `.yaaw-core/runtime/dispatch-failures.json` and updates it only after re-entering reality inspection. A failure counts only when:
- a child started and failed, was interrupted, returned no response, or returned an unusable/illegal result;
- post-failure inspection shows no durable progress attributable to that attempt; and
- role, workflow, active artifact, source revisions, transition sequence, and repository basis are unchanged.

Legal workflow results such as `REPAIR`, `REPLAN`, `BLOCKED`, or a real precondition result do not count as execution failures. Any durable progress or basis change resets the counter.

When a configured threshold is reached, the next attempt may use the host's stronger fallback execution profile while preserving the exact role and handoff. The fallback receives one attempt on an unchanged basis. If that attempt also fails with no progress, stop with `BLOCKED:AUTHORITY_EXECUTION_FAILED` rather than entering an unbounded retry loop.

## Authority execution profile fidelity invariant
A host adapter owns provider/model execution selection, but it may not silently substitute a different effective authority profile.

- The canonical handoff remains provider-neutral: role, workflow, artifacts, basis, and allowed results do not carry provider model identifiers.
- Before dispatch, the adapter resolves the required effective execution profile for the selected authority and, when applicable, the configured capability-fallback variant.
- Changing named worker -> generic worker is legal only when the generic path is already profile-equivalent or every mismatched profile dimension can be authoritatively corrected by the active spawn mechanism.
- Changing worker -> inline execution is legal only when the current/root execution profile is provably equivalent to the required authority profile. A user-selected host inline mode is the explicit exception because it deliberately opts out of per-role model isolation.
- Model and reasoning dimensions are compared independently. A matching dimension needs no override; a mismatched dimension requires an authoritative override for that dimension.
- Unknown inherited values remain symbolic. The adapter may treat two paths as equivalent when both resolve through the same `HOST_INHERIT` chain, but it must never guess that a concrete value equals an unknown inherited value.
- If isolation exists but the host cannot guarantee the configured model/reasoning profile, stop with `BLOCKED:HOST_EXECUTION_PROFILE_UNAVAILABLE`.
- If strict isolation is required and the host cannot create any isolated worker at all, stop with `BLOCKED:HOST_ISOLATION_UNAVAILABLE`.
- A profile/isolation stop that occurs before child creation is a host precondition failure, not an authority execution failure. It must not increment `.yaaw-core/runtime/dispatch-failures.json` or trigger capability escalation.
- Capability fallback uses the same resolver and fidelity rules as primary execution. If fallback selects a stronger profile, that exact effective profile must be preserved or dispatch blocks.

The Orchestrator may route a configured profile through the adapter; it may not invent, weaken, or replace that profile.

## Provider boundary
This contract is provider-neutral. Names of host tools, agent types, provider directories, model identifiers, and provider-specific spawning schemas belong only to integration adapters.
