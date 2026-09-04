# Controller mutation and recovery

The controller separates inspection from mutation. Commands are dry-run/read-only unless an explicit write flag is supplied.

## Atomic and idempotent mutation

Durable ticket transitions use atomic same-directory replacement. A mutating transition also requires an operation ID recorded in `.yaaw/runtime/idempotency.json`. The journal records `PENDING` before the file replacement and `COMPLETED` after it. If the process crashes between those steps, retrying the same operation ID observes the already-applied target state and completes the journal rather than applying the mutation twice. Reusing the same operation ID for different input fails closed.

`yaaw transition <ticket> --to <state>` validates only. Add `--write --operation-id <id>` to mutate.

## Lease recovery

A writer lease is reclaimable only when it is expired or its `work_id` is no longer an active (`IN_PROGRESS`/`VERIFYING`) durable ticket. `yaaw lease-reclaim <resource>` only reports the decision. `--write` performs the deletion after re-reading the lease and refusing a changed holder.

## Failure signatures

Repeated identical failure signatures are persisted in the controller snapshot. Crossing `max_same_failure_signature` is not another repair retry; it raises `STOP_AND_REPLAN` so the workflow cannot livelock on the same failure.

## Migration UX

`yaaw migrate` is dry-run by default and reports only artifacts that require a declared schema migration. `--write` applies migrations using atomic replacement. Unknown schema versions still fail closed; there is no implicit best-effort rewrite.

## Recovery without chat history

`yaaw recover` combines repository ticket state with the optional ephemeral controller snapshot. Durable repository state wins. A snapshot referencing a non-active or unknown ticket is rejected rather than overriding the repository. Without a snapshot, one active durable ticket can be reconstructed directly; multiple active tickets require explicit reconciliation.

Runtime snapshots and idempotency journals are ephemeral controller state. They are not replacements for durable tickets, specs, PRDs, ADRs, PLAN_DELTA records, QA evidence or Git history.
