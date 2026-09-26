# State model

Canonical project state is `.yaaw-core/project/state.json` using `yaaw.project-state/v2`.

State is a routing/adoption ledger, not semantic authority. Ticket frontmatter is admission/history metadata and never overrides the reconciled ticket lifecycle value in state.

## State writer
Orchestrator is the only physical writer of `state.json`. Semantic roles create durable facts: Planner creates engineering/spec/ticket facts, Implementer creates start/verification evidence, Reviewer creates immutable review results. Orchestrator validates and adopts those facts through legal transitions.

## Planning completion
`planning.scope_status` mirrors Planner-owned `engineering.md`: `UNKNOWN`, `OPEN`, or `COMPLETE`. Orchestrator never infers COMPLETE from absence of runnable tickets.

## Provenance
Every adopted mutation increments `transition_sequence` and records subject, from/to, workflow, reason, evidence, and observed commit.
