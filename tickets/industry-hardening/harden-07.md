---yaaw-json
{"schema":"yaaw.ticket/v1","id":"HARDEN-07","kind":"DELIVERY","status":"DONE","level":4,"parent":"INIT-INDUSTRY-HARDENING","owner":"orchestrator","blocked_by":["HARDEN-06"],"acceptance":["Require provenance-bearing evidence, risk-specific QA, delivery stages, provider observation and promotion authority."],"qa":{"required":true,"profile":"HIGH_ASSURANCE"},"allowed_write":["scripts/yaaw/**",".agents/schemas/**","config/**","tests/harness/**"],"forbidden_write":["main branch promotion without final validation"],"expected_change_surface":["scripts/yaaw/**",".agents/schemas/**","config/**","tests/harness/**"],"source_fingerprints":{},"risk":["agent-harness-control-plane"],"side_effects":["repository"]}
---
# HARDEN-07: Evidence QA integration and delivery gates

## What to deliver

Require provenance-bearing evidence, risk-specific QA, delivery stages, provider observation and promotion authority.

## Acceptance criteria

- [x] Evidence freshness is tied to commit/source fingerprints.
- [x] DEPLOYED requires observed provider state where policy requires it.
- [x] Commit `ae272e7cdc6d13bb2c853c3534dc3f38d7dcebf2` records the phase.

## Preservation invariants

- Missing evidence/checks are blockers, never silent waivers.

## Allowed write scope

- QA/delivery controller, schemas, policy and tests.

## Forbidden write scope

- `main` promotion until final validation.

## Expected change surface

- QA/evidence/delivery assets.

## Canonical sources

- Commit `ae272e7cdc6d13bb2c853c3534dc3f38d7dcebf2`.

## Verification

- QA/delivery tests and subsequent semantic CI.

## QA disposition

`INDEPENDENT_QA_REQUIRED`

## Stop and replan triggers

- Provider/environment truth cannot be observed.

## Implementation evidence

- commit/ref: `ae272e7cdc6d13bb2c853c3534dc3f38d7dcebf2`

## QA result

- result: `PASS`.

## Delivery

- commit/ref: `ae272e7cdc6d13bb2c853c3534dc3f38d7dcebf2`
- stage: `COMMITTED`
