---yaaw-json
{"schema":"yaaw.ticket/v1","id":"HARDEN-11","kind":"DELIVERY","status":"DONE","level":4,"parent":"INIT-INDUSTRY-HARDENING","owner":"orchestrator","blocked_by":["HARDEN-10"],"acceptance":["Expand CI from referential checks to cross-file semantics, schemas, migrations, state, lint and unit behavior."],"qa":{"required":true,"profile":"HIGH_ASSURANCE"},"allowed_write":["scripts/validate_*.py",".github/workflows/agent-harness.yml",".agents/catalog.json"],"forbidden_write":["main branch promotion without final validation"],"expected_change_surface":["scripts/validate_*.py",".github/workflows/agent-harness.yml",".agents/catalog.json"],"source_fingerprints":{},"risk":["agent-harness-control-plane"],"side_effects":["repository"]}
---
# HARDEN-11: Semantic CI and executable harness validation

## What to deliver

Expand CI from referential checks to cross-file semantics, schemas, migrations, state, lint and unit behavior.

## Acceptance criteria

- [x] CI checks semantic cross-file consistency and executable harness behavior.
- [x] Commit `1f051c60bbcd697ab21b6eef7b240a206f219143` records the phase.

## Preservation invariants

- Validators fail closed instead of normalizing contradictory state.

## Allowed write scope

- validation scripts, workflow and catalog.

## Forbidden write scope

- `main` promotion until final validation.

## Expected change surface

- semantic CI assets.

## Canonical sources

- Commit `1f051c60bbcd697ab21b6eef7b240a206f219143`.
- Corrective PLAN_DELTA `DELTA-20260904-CI-FIXTURE`.

## Verification

- GitHub Actions run `33803406813` exposed a malformed newly-added test fixture after all preceding semantic gates passed.
- Corrective work is recorded separately as `HARDEN-12`.

## QA disposition

`INDEPENDENT_QA_REQUIRED`

## Stop and replan triggers

- CI reports a contradiction; do not weaken the check solely to get green.

## Implementation evidence

- commit/ref: `1f051c60bbcd697ab21b6eef7b240a206f219143`

## QA result

- result: phase delivered with explicit corrective follow-up `HARDEN-12`.

## Delivery

- commit/ref: `1f051c60bbcd697ab21b6eef7b240a206f219143`
- stage: `COMMITTED`
