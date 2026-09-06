# Select ticket

## Purpose
Let Orchestrator choose exactly one safe implementation unit before an Implementer dispatch. The legacy workflow ID is retained for compatibility, but authority is Orchestrator.

## Inputs
Canonical ticket paths from the artifact registry, ticket lifecycle state, dependencies, current source revisions, repository reality, and optional specifically requested target artifact.

## Procedure
1. If state/repository disagree, route to orchestration recovery first.
2. Reject `DRAFT`, `BLOCKED`, `REPLAN_REQUIRED`, `REPAIR_REQUIRED`, `REVIEW_REQUIRED`, `PASS`, or stale-source tickets for normal implementation.
3. Choose the specifically requested eligible ticket, otherwise the next dependency-satisfied `READY` ticket.
4. Revalidate exact source spec/product/engineering revisions immediately before admission.
5. If no eligible ticket exists, return `PRECONDITION_UNSATISFIED` with `NO_READY_TICKET`; do not dispatch Implementer.

## Output
One exact admitted `.yaaw/tickets/<SPEC-ID>/<TASK-ID>.md` or a no-ticket/blocker result.
