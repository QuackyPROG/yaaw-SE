---yaaw-json
{"schema":"yaaw.ticket/v1","id":"HARDEN-15","kind":"DELIVERY","status":"READY","level":4,"parent":"INIT-INDUSTRY-HARDENING","owner":"orchestrator","blocked_by":["HARDEN-14"],"acceptance":["Add explicit mutation commands and idempotent state operations, lease reclamation, bounded repair/failure signatures, migration command UX, and resumable controller lifecycle."],"qa":{"required":true,"profile":"HIGH_ASSURANCE"},"allowed_write":["scripts/yaaw/**","scripts/yaaw_cli.py","config/**","tests/harness/**","docs/workflow/**"],"forbidden_write":["main promotion before final green CI"],"expected_change_surface":["scripts/yaaw/**","scripts/yaaw_cli.py","config/**","tests/harness/**","docs/workflow/**"],"source_fingerprints":{"blocked_by_harden_14":"423a6c40189c6d7eab7d3e73532fa9ef40b56ac8"},"risk":["agent-harness-control-plane"],"side_effects":["repository"]}
---
# HARDEN-15: Atomic controller mutation, idempotency and recovery lifecycle

## What to deliver

Add explicit mutation commands and idempotent state operations, lease reclamation, bounded repair/failure signatures, migration command UX, and resumable controller lifecycle.

## Acceptance criteria

- [ ] Mutations are explicit, atomic and idempotent where retry is possible.
- [ ] Stale/orphan writer leases can be safely reclaimed.
- [ ] Repeated repair failure signatures trigger replan/escalation rather than livelock.
- [ ] Schema migration is exposed through dry-run-first CLI UX.
- [ ] Recovery reconstructs active state without chat history.

## Preservation invariants

- Inspection commands remain non-mutating.
- Completed history remains immutable.

## Allowed write scope

- controller/CLI/policy/tests/docs listed in metadata.

## Forbidden write scope

- `main` promotion before final integration validation.

## Expected change surface

- controller mutation/recovery surfaces.

## Canonical sources

- initiative map and ADR-001.
- `HARDEN-14` completed at `423a6c40189c6d7eab7d3e73532fa9ef40b56ac8`.

## Verification

- atomicity/idempotency/recovery tests and adversarial evals.

## QA disposition

`INDEPENDENT_QA_REQUIRED` with `HIGH_ASSURANCE` profile.

## Stop and replan triggers

- Mutation requires semantic authority the controller cannot infer.

## Implementation evidence

Pending.

## QA result

Pending independent/high-assurance evidence.

## Delivery

Pending.
