# Implement ticket

## Purpose
Implement one admitted bounded ticket and produce reviewable evidence.

## Preconditions
Ticket is `READY`, dependencies pass, source revisions are current, and repository state is consistent.

## Procedure
1. Load the ticket, referenced product/spec/decisions, relevant rules/expertise, and relevant code only.
2. Record `READY -> IN_PROGRESS` with transition provenance and repository identity.
3. Implement strictly within allowed scope.
4. If a material missing decision appears, transition to `REPLAN_REQUIRED` or `BLOCKED`; do not invent it.
5. Execute `implementation.verify-ticket`.
6. Persist evidence tied to ticket/spec revisions and repository identity.
7. Transition `IN_PROGRESS -> REVIEW_REQUIRED` only when required evidence exists.

## Output
Reviewable implementation plus evidence, or explicit replan/blocker state.
