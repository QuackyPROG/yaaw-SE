# Recovery and resumption

A new Orchestrator must be able to resume work without conversation history.

## Durable truth first

Recovery reads, in order:

1. `AGENTS.md` and the initiative/current ticket;
2. current Git branch/head/diff;
3. structured ticket graph and READY frontier;
4. canonical PRD/spec/ADR/source fingerprints;
5. CI/evidence recorded for the current state;
6. optional `.yaaw/runtime/` snapshot/lease/event data.

Ephemeral state may accelerate resumption but cannot override durable repository state.

## Active work

If exactly one ticket is `IN_PROGRESS` or `VERIFYING`, repository state identifies active work even when no snapshot survives. If a snapshot names an active ticket, it must agree with durable state. A snapshot naming a DONE/nonexistent ticket or conflicting with another active ticket blocks recovery until reconciliation; it is never silently treated as truth.

## Leases

Writer leases have holders, work IDs and expiry. Reclamation is explicit and dry-run-first. An expired/orphaned lease may be reclaimed only when the controller can establish that its holder is no longer active. This prevents a second writer from being created merely because a thread disappeared.

## Idempotency

Mutation operations may carry operation IDs. Replaying the same operation with the same intent returns the prior result; reusing an operation ID for different intent fails. Ticket writes use atomic replacement so an interrupted process does not intentionally leave half-written structured state.

## Failure loops

Failure signatures are persisted into recovery state. Repeated identical signatures are bounded and eventually require `STOP_AND_REPLAN`. A restart therefore does not reset a pathological repair loop just because chat context disappeared.

## Schema migration

Durable artifact migrations are explicit and dry-run-first. Unknown schema versions fail rather than being rewritten heuristically. A breaking artifact shape requires a new schema ID plus a declared migration path.
