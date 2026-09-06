# Dispatch one handoff

## Purpose
Execute exactly one already-selected canonical workflow. This file is not the orchestration loop.

## Inputs
`.yaaw/runtime/handoff.json` created by `orchestration.determine-next-action`.

## Procedure
1. Validate handoff schema, workflow registry entry, role, desired intent, exact `reads`/`writes`/`forbidden_writes`, source revisions, transition-sequence basis, and repository identity.
2. If any basis is stale, discard the handoff and return `STALE_HANDOFF` to `orchestration.route`; do not execute it.
3. Load target role contract, target workflow contract, exact handoff reads, selected expertise, and only ticket/planning-admitted repository context.
4. The target role must not search for YAAW workflow artifacts outside the exact handoff. Missing required artifacts return `PRECONDITION_UNSATISFIED` rather than guesswork.
5. Execute the target workflow once. The target role may not invoke another role/workflow as a successor.
6. Require permitted durable output plus one explicit result from `expected_results`.
7. Reject/flag writes outside the handoff write set or into forbidden paths.
8. Return the result and durable-output identities to `orchestration.route`; Orchestrator validates/persists any legal lifecycle transition.
9. Mark/remove the consumed runtime handoff.

Never recursively dispatch `orchestration.dispatch` as its own target.
