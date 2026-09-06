# Determine next action

## Purpose
Turn reconciled observed reality plus desired intent into one explicit, fresh dispatch contract.

## Inputs
Current observed-state snapshot, reconciled state, `.yaaw/runtime/intent.json`, `core/routing.md`, artifact/role-I/O/workflow/expertise registries.

## Procedure
1. Resolve prerequisites using `registries/routing-policy.json`; prerequisite state always outranks requested destination.
2. If product is missing/unready, select PRD. If engineering is unresolved, select Planner. If readiness passes but no accepted spec exists, select spec creation. If an accepted spec has no executable ticket, select ticket creation.
3. Apply ticket-state precedence: `REPLAN_REQUIRED` -> Planner; `REPAIR_REQUIRED` -> repair; `REVIEW_REQUIRED` -> Reviewer; `IN_PROGRESS` -> recovery; dependency-satisfied `READY` -> Implementer.
4. Never select `implementation.implement-ticket` unless exactly one current dependency-satisfied `READY` ticket can be admitted. Missing ticket is a planning prerequisite, not an Implementer task.
5. Honor explicit refine/revise/readiness/spec/ticket intents only when their upstream prerequisites are valid; otherwise continue resolving prerequisites first.
6. Resolve the active artifact and every workflow artifact path through `registries/artifacts.json`.
7. Build exact `reads`, `writes`, and `forbidden_writes` from `registries/role-io.json`, then narrow them to the current artifact IDs/revisions and ticket scope. Do not send generic repository-wide artifact discovery instructions to semantic roles.
8. Select only expertise relevant to that workflow/artifact.
9. Write `.yaaw/runtime/handoff.json` with role, workflow, desired intent, active artifact, exact read/write sets, references/revisions, expertise, expected results, repository identity, and transition-sequence basis.
10. If result is human-input, `BLOCKED`, or `COMPLETE`, write no executable handoff and return the stop result.

## Boundary
Do not perform target role semantic work here and do not let a target role choose/spawn its successor.
