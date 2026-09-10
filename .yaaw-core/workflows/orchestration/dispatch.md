# Dispatch one handoff

## Purpose
Execute exactly one already-selected canonical workflow. This file is not the orchestration loop.

## Inputs
`.yaaw/runtime/handoff.json` created by `orchestration.determine-next-action`, plus canonical workflow/role/context-policy registries needed to validate and resolve that handoff. Learned project memory is never used to validate routing.

## Procedure
1. Validate handoff schema, workflow registry entry, role, desired intent, exact `reads`/`writes`/`forbidden_writes`, source revisions, transition-sequence basis, repository identity, and `context_policy` against `registries/context-policy.json`.
2. Resolve `handoff.workflow` through `registries/workflows.json`, read that exact workflow file, and prove its authoritative `## Inputs` are covered by the handoff/current dispatch basis. Do not infer a workflow path from the role name.
3. If any basis is stale, any required workflow input is unresolved, or the context policy does not match the selected role, discard the handoff and return `STALE_HANDOFF` or the appropriate typed prerequisite result to `orchestration.route`; do not execute it.
4. Spawn/enter the target role with a self-contained first task message that instructs it to read the exact handoff first, then its role contract, resolve/read the exact `handoff.workflow` contract, and only then load the handoff-authorized inputs. The message also names the active artifact/goal and context policy. Any memory auto-injected by the host is quarantined as learned/advisory until authoritative loading completes.
5. Assemble and validate authoritative target context first: exact handoff, target role contract, exact target workflow contract, exact handoff reads, selected expertise, and only ticket/planning-admitted repository/evidence context.
6. The target role must not search for YAAW workflow artifacts outside the exact handoff. Missing required artifacts return `PRECONDITION_UNSATISFIED` rather than guesswork.
7. Only after authoritative context is assembled, apply the target role's `context_policy`. If memory is enabled and the harness already exposes a provider, enrich with a small relevant learned-memory envelope according to `core/project-memory.md`; for Hindsight use `integrations/hindsight.md`. Memory retrieval never expands handoff authority.
8. If memory is absent, disabled, unavailable, empty, stale, wrong, or times out, continue from authoritative context. Memory failure is non-blocking and cannot change the selected workflow.
9. Execute the target workflow once. Same-role internal subworkflows inherit the exact handoff, revisions, repository basis, context policy, writes, and forbidden writes; they may not broaden authority. The target role may not invoke another role/workflow as a successor.
10. Require permitted durable output plus one explicit result from `expected_results`. Auxiliary memory-provider writes never satisfy this requirement.
11. Reject/flag writes outside the handoff write set or into forbidden paths.
12. Return the result and durable-output identities to `orchestration.route`; Orchestrator validates/persists any legal lifecycle transition.
13. Mark/remove the consumed runtime handoff.

Never recursively dispatch `orchestration.dispatch` as its own target.
