# Determine next action

## Purpose
Turn reconciled observed reality into one explicit, fresh dispatch contract.

## Inputs
Current observed-state snapshot, reconciled state, `core/routing.md`, workflow/execution/artifact/role-I/O/expertise registries, and optional current intent.

## Procedure
1. Choose exactly one next canonical workflow or terminal state using explicit routing precedence. Do not load candidate workflow bodies while choosing.
2. Resolve its repository requirement from `registries/execution-policy.json`.
3. If requirement is `IDENTITY` and repository status is not `READY`, return `PRECONDITION_UNSATISFIED:REPOSITORY_IDENTITY_UNAVAILABLE` or `BLOCKED` as appropriate; do not dispatch.
4. Resolve exact read/write/forbidden-write artifact classes from `registries/role-io.json` and exact current artifact references.
5. Select only YAAW expertise relevant to the selected workflow/artifact. Host expertise is admitted only through `rules/research-admission.md`.
6. Write `.yaaw-core/runtime/handoff.json` conforming to handoff v2 with desired intent, role, workflow ID, exact references/revisions, read/write sets, expertise, expected output/result vocabulary, repository requirement/basis, and transition sequence.
7. If the result is human-input, BLOCKED, or COMPLETE, write no executable handoff and return the stop result.

## Boundary
Do not perform target role semantic work here.

## Invalidation routing

Use `registries/routing-policy.json` `invalidation_routes`. Contract-stale causes select `planning.replan`; acceptance-stale causes select `review.review-ticket`.
