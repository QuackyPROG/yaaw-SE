# State model

Canonical machine-readable project state is `.yaaw-core/project/state.json` using `yaaw.project-state/v1`.

State is a routing cache and claim ledger. It is never trusted blindly over stronger domain evidence.

## Lifecycle authority
For routing and workflow preconditions, `.yaaw-core/project/state.json` `tickets[TASK-NNN]` is the current lifecycle ledger. Ticket frontmatter `status` is artifact metadata/admission history and may retain an earlier value after later lifecycle transitions; it does not override the reconciled state ledger.

Roles whose workflow depends on lifecycle status must receive `state` in their read set. Orchestrator reconciles the ledger against stronger artifact, review, evidence, and repository reality before dispatch.

## State writer
Orchestrator is the physical writer of `state.json`. A transition's role owner remains the semantic decision authority. For example, Reviewer decides `PASS`/`REPAIR`/`REPLAN`/`BLOCKED` in an immutable review; Orchestrator validates that durable result and records exactly the corresponding lifecycle transition and provenance. Orchestrator may not substitute its own acceptance judgment.

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

`.yaaw-core/runtime/observed-state.json` and `.yaaw-core/runtime/handoff.json` are replaceable caches used to survive interruption inside orchestration. Their bases must be revalidated before use.

Legal transitions are defined in `core/transitions.md`.
