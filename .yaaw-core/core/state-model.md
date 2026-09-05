# State model

Canonical machine-readable project state is `.yaaw/state.json` using `yaaw.project-state/v1`.

State is a routing cache and claim ledger. It is never trusted blindly over stronger evidence.

Ticket states:

`DRAFT`, `READY`, `IN_PROGRESS`, `REVIEW_REQUIRED`, `REPAIR_REQUIRED`, `REPLAN_REQUIRED`, `BLOCKED`, `PASS`, `CANCELLED`.

Project phases:

`product`, `planning`, `implementation`, `complete`, `blocked`.

Any state transition must preserve enough provenance to reconstruct why it happened, including active artifact and last observed commit when available.
