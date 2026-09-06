# Dispatch one handoff

## Purpose
Execute exactly one already-selected canonical workflow. This file is not the orchestration loop.

## Inputs
`.yaaw/runtime/handoff.json` created by `orchestration.determine-next-action`.

## Procedure
1. Validate handoff schema, workflow registry entry, role, desired intent, exact `reads`/`writes`/`forbidden_writes`, source revisions, transition-sequence basis, repository identity, and `context_policy` against `registries/context-policy.json`.
2. If any basis is stale or the context policy does not match the selected role, discard the handoff and return `STALE_HANDOFF` to `orchestration.route`; do not execute it.
3. Spawn/enter the target role with a self-contained first task message that names the exact role, workflow, active artifact/goal, handoff path, and context policy. This gives session-start memory systems a task-specific goal instead of a generic repository prompt.
4. Load target role contract, target workflow contract, exact handoff reads, selected expertise, and only ticket/planning-admitted repository context.
5. The target role must not search for YAAW workflow artifacts outside the exact handoff. Missing required artifacts return `PRECONDITION_UNSATISFIED` rather than guesswork.
6. If the context policy enables project memory, let the target role use `core/project-memory.md` at the prescribed phase. Memory retrieval does not expand handoff read/write authority and failure to retrieve memory is non-blocking.
7. Execute the target workflow once. The target role may not invoke another role/workflow as a successor.
8. Require permitted durable output plus one explicit result from `expected_results`.
9. Reject/flag writes outside the handoff write set or into forbidden paths.
10. Return the result and durable-output identities to `orchestration.route`; Orchestrator validates/persists any legal lifecycle transition.
11. Mark/remove the consumed runtime handoff.

Never recursively dispatch `orchestration.dispatch` as its own target.
