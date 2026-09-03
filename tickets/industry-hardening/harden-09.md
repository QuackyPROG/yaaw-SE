---yaaw-json
{"schema":"yaaw.ticket/v1","id":"HARDEN-09","kind":"DELIVERY","status":"DONE","level":4,"parent":"INIT-INDUSTRY-HARDENING","owner":"orchestrator","blocked_by":["HARDEN-08"],"acceptance":["Version PRD/SPEC/ADR/map/PLAN_DELTA metadata and declare explicit fail-closed migrations."],"qa":{"required":true,"profile":"HIGH_ASSURANCE"},"allowed_write":[".agents/schemas/**","docs/templates/**","scripts/yaaw/**","docs/workflow/schema-versioning.md","tests/harness/**"],"forbidden_write":["main branch promotion without final validation"],"expected_change_surface":[".agents/schemas/**","docs/templates/**","scripts/yaaw/**","docs/workflow/schema-versioning.md","tests/harness/**"],"source_fingerprints":{},"risk":["agent-harness-control-plane"],"side_effects":["repository"]}
---
# HARDEN-09: Version durable schemas and migrations

## What to deliver

Version PRD/SPEC/ADR/map/PLAN_DELTA metadata and declare explicit fail-closed migrations.

## Acceptance criteria

- [x] Durable artifact metadata has explicit schema identity.
- [x] Unknown/skipped migrations fail closed.
- [x] Commit `2187ef7e37c3c607fd942c1952c0a0503bca25f6` records the phase.

## Preservation invariants

- Migration changes structure, not semantic intent/history.

## Allowed write scope

- durable schemas/templates/migration code/tests/docs.

## Forbidden write scope

- `main` promotion until final validation.

## Expected change surface

- schema/version/migration assets.

## Canonical sources

- Commit `2187ef7e37c3c607fd942c1952c0a0503bca25f6`.

## Verification

- schema/migration tests and CI.

## QA disposition

`INDEPENDENT_QA_REQUIRED`

## Stop and replan triggers

- A migration would reinterpret accepted product/architecture history.

## Implementation evidence

- commit/ref: `2187ef7e37c3c607fd942c1952c0a0503bca25f6`

## QA result

- result: `PASS`.

## Delivery

- commit/ref: `2187ef7e37c3c607fd942c1952c0a0503bca25f6`
- stage: `COMMITTED`
