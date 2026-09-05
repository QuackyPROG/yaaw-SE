# State model

Canonical machine-readable project state is `.yaaw/state.json` using `yaaw.project-state/v1`.

State is a routing cache and claim ledger. It is never trusted blindly over stronger domain evidence.

## Ticket states
`DRAFT`, `READY`, `IN_PROGRESS`, `REVIEW_REQUIRED`, `REPAIR_REQUIRED`, `REPLAN_REQUIRED`, `BLOCKED`, `PASS`, `CANCELLED`.

## Project phases
`product`, `planning`, `implementation`, `complete`, `blocked`.

## Required provenance
Every mutation increments `transition_sequence` and writes `last_transition` with:
- subject (`project` or `TASK-NNN`);
- from/to state;
- canonical workflow ID;
- reason;
- evidence references;
- observed repository commit when available.

`BLOCKED` state records a blocker summary and exact missing evidence/decision.

`.yaaw/runtime/observed-state.json` and `.yaaw/runtime/handoff.json` are replaceable caches used to survive interruption inside orchestration. Their bases must be revalidated before use.

Legal transitions are defined in `core/transitions.md`.
