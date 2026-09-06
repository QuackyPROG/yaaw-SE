# Implement ticket

## Purpose
Implement one admitted bounded ticket and produce reviewable evidence.

## Preconditions
Ticket is `READY`, dependencies pass, source revisions are current, and repository state is consistent.

## Procedure
1. Load the ticket, referenced product/spec/decisions, `.yaaw-core/rules/changeability.md`, relevant rules/expertise, and relevant code only.
2. Record `READY -> IN_PROGRESS` with transition provenance and repository identity.
3. Establish the minimum authorized implementation surface before editing.
4. Implement strictly within allowed scope while applying only the changeability principles relevant to the changed surface: visible main path, domain naming, external boundaries, valid-state modeling, decision/side-effect separation, useful failures, and focused change scope.
5. Do not perform style-only rewrites, speculative abstractions, or unrelated cleanup. If a discovered maintainability issue is not necessary for safe ticket completion, leave it unchanged and surface it as a future planning candidate when materially valuable.
6. If a material missing decision appears, transition to `REPLAN_REQUIRED` or `BLOCKED`; do not invent it.
7. Execute `implementation.verify-ticket`, including targeted verification for materially affected changeability properties.
8. Persist evidence tied to ticket/spec revisions and repository identity.
9. Transition `IN_PROGRESS -> REVIEW_REQUIRED` only when required evidence exists.

## Output
Reviewable implementation plus evidence, or explicit replan/blocker state.
