# Determine next action

## Purpose
Turn reconciled observed reality into one explicit, fresh dispatch contract.

## Inputs
Current observed-state snapshot, reconciled state, `core/routing.md`, workflow/expertise registries.

## Procedure
1. Choose exactly one next canonical workflow or terminal state using explicit routing precedence.
2. Select only expertise relevant to that workflow/artifact.
3. Write `.yaaw/runtime/handoff.json` conforming to the handoff schema with role, workflow ID, active artifact, exact references/revisions, selected expertise, expected output, repository identity, and transition sequence basis.
4. If the result is human-input, BLOCKED, or COMPLETE, write no executable handoff and return the stop result.

## Boundary
Do not perform target role semantic work here.
