# Dispatch one handoff

## Purpose
Execute exactly one already-selected canonical workflow. This file is not the orchestration loop.

## Inputs
`.yaaw/runtime/handoff.json` created by `orchestration.determine-next-action`.

## Procedure
1. Validate handoff schema, workflow registry entry, role, desired intent, exact `reads`/`writes`/`forbidden_writes`, source revisions, transition-sequence basis, repository identity, and `context_policy` against `registries/context-policy.json`.
2. If any basis is stale or the context policy does not match the selected role, discard the handoff and return `STALE_HANDOFF` to `orchestration.route`; do not execute it.
3. Spawn/enter the target role with a self-contained first task message that names the exact role, workflow, active artifact/goal, handoff path, and context policy. This gives session-start memory systems a task-specific goal instead of a generic repository prompt. Any memory auto-injected by the host at this point is quarantined as learned/advisory until step 4 completes.
4. Assemble and validate authoritative target context first: target role contract, target workflow contract, exact handoff reads, selected expertise, and only ticket/planning-admitted repository/evidence context.
5. The target role must not search for YAAW workflow artifacts outside the exact handoff. Missing required artifacts return `PRECONDITION_UNSATISFIED` rather than guesswork.
6. Only after authoritative context is assembled, apply the target role's `context_policy`. If memory is enabled and the harness already exposes a provider, enrich with a small relevant learned-memory envelope according to `core/project-memory.md`; for Hindsight use `integrations/hindsight.md`. Memory retrieval never expands handoff authority.
7. If memory is absent, disabled, unavailable, empty, stale, wrong, or times out, continue from authoritative context. Memory failure is non-blocking and cannot change the selected workflow.
8. Execute the target workflow once. The target role may not invoke another role/workflow as a successor.
9. Require permitted durable output plus one explicit result from `expected_results`. Auxiliary memory-provider writes never satisfy this requirement.
10. Reject/flag writes outside the handoff write set or into forbidden paths.
11. Return the result and durable-output identities to `orchestration.route`; Orchestrator validates/persists any legal lifecycle transition.
12. Mark/remove the consumed runtime handoff.

Never recursively dispatch `orchestration.dispatch` as its own target.
