# Select ticket

## Purpose
Choose exactly one safe implementation unit.

## Inputs
Ticket states, dependencies, current source revisions, repository reality, and optional specifically requested ticket.

## Procedure
1. If state/repository disagree, route to orchestration recovery first.
2. Reject `DRAFT`, `BLOCKED`, `REPLAN_REQUIRED`, `REPAIR_REQUIRED`, `REVIEW_REQUIRED`, `PASS`, or stale-source tickets for normal implementation.
3. Choose the specifically requested eligible ticket, otherwise the next dependency-satisfied `READY` ticket.
4. Revalidate source spec/product/engineering revisions immediately before admission.

## Output
One admitted `READY` ticket or no-ticket/blocker result.
