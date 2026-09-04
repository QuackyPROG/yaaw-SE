---yaaw-json
{"schema":"yaaw.ticket/v1","id":"HARDEN-15","kind":"DELIVERY","status":"DONE","level":4,"parent":"INIT-INDUSTRY-HARDENING","owner":"orchestrator","blocked_by":["HARDEN-14"],"acceptance":["Add explicit mutation commands and idempotent state operations, lease reclamation, bounded repair/failure signatures, migration command UX, and resumable controller lifecycle."],"qa":{"required":true,"profile":"HIGH_ASSURANCE"},"allowed_write":["scripts/yaaw/**","scripts/yaaw_cli.py","config/**","tests/harness/**","docs/workflow/**"],"forbidden_write":["main promotion before final green CI"],"expected_change_surface":["scripts/yaaw/**","scripts/yaaw_cli.py","config/**","tests/harness/**","docs/workflow/**"],"source_fingerprints":{"implementation_commit":"8a072812138d8e8b54fa130ef4d0787dd1a354fa","ci_run":"33845686121"},"risk":["agent-harness-control-plane"],"side_effects":["repository"]}
---
# HARDEN-15: Atomic controller mutation, idempotency and recovery lifecycle

## What to deliver

Add explicit mutation commands and idempotent state operations, lease reclamation, bounded repair/failure signatures, migration command UX, and resumable controller lifecycle.

## Acceptance criteria

- [x] Mutations are explicit, atomic and idempotent where retry is possible.
- [x] Stale/orphan writer leases can be safely reclaimed.
- [x] Repeated repair failure signatures trigger replan/escalation rather than livelock.
- [x] Schema migration is exposed through dry-run-first CLI UX.
- [x] Recovery reconstructs active state without chat history.

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

- implementation commit `8a072812138d8e8b54fa130ef4d0787dd1a354fa`
- GitHub Actions run `33845686121`: SUCCESS
- atomic/idempotent transition tests: PASS
- orphan lease reclamation tests: PASS
- failure-signature escalation/recovery tests: PASS
- adversarial recovery and repeated-failure scenarios: PASS
- full semantic/schema/migration/runtime/state/policy/scope harness: PASS

## QA disposition

`HIGH_ASSURANCE` supported by hosted CI plus orthogonal unit, semantic and adversarial evidence. Ephemeral snapshot/journal files remain intentionally non-canonical; contradictory durable repository state fails closed.

## Stop and replan triggers

- Mutation requires semantic authority the controller cannot infer.

## Implementation evidence

`8a072812138d8e8b54fa130ef4d0787dd1a354fa` adds atomic operation journaling, explicit mutation CLI, stale/orphan lease reclamation, persisted failure signatures, dry-run-first migrations and repository-first recovery.

## QA result

PASS — all executable gates passed on GitHub Actions run `33845686121`. Residual risk is limited to host/filesystem guarantees outside yaaw-SE control; controller logic uses same-directory atomic replacement and re-reads contested leases before deletion.

## Delivery

Integrated on `feat/industry-hardening` at `8a072812138d8e8b54fa130ef4d0787dd1a354fa`; CI green. `main` remains untouched pending `HARDEN-19`.
