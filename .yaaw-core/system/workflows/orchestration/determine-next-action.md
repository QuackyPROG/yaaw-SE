# Determine next action

## Purpose
Turn reconciled observed reality into one explicit, fresh dispatch contract.

## Inputs
Current observed-state snapshot, reconciled state, `.yaaw-core/system/core/routing.md`, workflow/execution/artifact/role-I/O/expertise registries, and optional current intent.

## Procedure
1. Require the current observed framework integrity status to be `HEALTHY`. Otherwise return the typed framework stop and write no executable handoff.
2. Choose exactly one next canonical workflow or terminal state using explicit routing precedence. Do not load candidate workflow bodies while choosing.
3. Resolve its repository requirement from `.yaaw-core/system/registries/execution-policy.json`.
4. If requirement is `IDENTITY` and repository status is not `READY`, return `PRECONDITION_UNSATISFIED:REPOSITORY_IDENTITY_UNAVAILABLE` or `BLOCKED` as appropriate; do not dispatch.
5. Resolve exact read/write/forbidden-write artifact classes from `.yaaw-core/system/registries/role-io.json` and exact current artifact references.
6. Select only YAAW expertise relevant to the selected workflow/artifact. Host expertise is admitted only through `.yaaw-core/system/rules/research-admission.md`.
7. Write `.yaaw-core/runtime/handoff.json` conforming to handoff v2 with desired intent, role, workflow ID, exact references/revisions, read/write sets, expertise, expected output/result vocabulary, repository requirement/basis, and transition sequence.
8. If the result is human-input, BLOCKED, or COMPLETE, write no executable handoff and return the stop result.

## Boundary
Do not perform target role semantic work here.

## Framework write guard

Before persisting a handoff, verify that its write set is a subset of the selected role's canonical artifact writes and contains no installer-managed artifact or `.yaaw-core/system/**` path. A framework defect is a stop condition, never a target workflow.
