# Select ticket

## Purpose
Choose exactly one safe implementation unit.

## Inputs
Ticket states, dependencies, current source revisions, repository status/identity, and optional specifically requested ticket.

## Procedure
1. Require repository status `READY`; otherwise return `PRECONDITION_UNSATISFIED:REPOSITORY_IDENTITY_UNAVAILABLE` to Orchestrator.
2. If state/repository disagree, return control to orchestration recovery first.
3. Reject `DRAFT`, `BLOCKED`, `REPLAN_REQUIRED`, `REPAIR_REQUIRED`, `REVIEW_REQUIRED`, `PASS`, or stale-source tickets for normal implementation.
4. Choose the specifically requested eligible ticket, otherwise the next dependency-satisfied `READY` ticket.
5. Revalidate source spec/product/engineering revisions immediately before admission.

## Output
One admitted `READY` ticket, or `PRECONDITION_UNSATISFIED:NO_READY_TICKET` / another exact blocker result for Orchestrator.
