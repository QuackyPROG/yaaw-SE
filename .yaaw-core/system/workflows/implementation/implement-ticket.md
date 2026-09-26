# Implement ticket

## Purpose
Implement one admitted bounded ticket while making interruption recoverable from durable facts.

## Preconditions
Reconciled state says the ticket is `READY`; source revisions are current; dependencies pass; repository identity is `READY`.

## Procedure
1. Read the exact handoff, state, ticket, source contracts, applicable rules/expertise, and minimal code.
2. Before editing any application file, write immutable v3 `implementation_start` evidence with result `STARTED`, current ticket/spec revisions, workflow ID, and the exact pre-edit repository identity.
3. Only after that durable start fact exists, implement strictly inside allowed scope.
4. If a material contract gap appears, stop with `REPLAN_REQUIRED` or `BLOCKED`; do not invent it.
5. Execute `implementation.verify-ticket`.
6. Persist verification evidence. Do not mutate lifecycle state directly.

## Output
Bounded implementation plus durable start/verification evidence or a typed stop. Orchestrator adopts `READY -> IN_PROGRESS` from start evidence and `IN_PROGRESS -> REVIEW_REQUIRED` only from current PASS verification.
