---yaaw-json
{"schema":"yaaw.ticket/v1","id":"HARDEN-05","kind":"DELIVERY","status":"DONE","level":4,"parent":"INIT-INDUSTRY-HARDENING","owner":"orchestrator","blocked_by":["HARDEN-04"],"acceptance":["Make ticket metadata stable and machine-addressable; fix QA/evidence locators and tracker semantics."],"qa":{"required":true,"profile":"HIGH_ASSURANCE"},"allowed_write":[".agents/artifacts.json","docs/templates/**","tickets/README.md","scripts/yaaw/**","tests/harness/**"],"forbidden_write":["main branch promotion without final validation"],"expected_change_surface":[".agents/artifacts.json","docs/templates/**","tickets/README.md","scripts/yaaw/**","tests/harness/**"],"source_fingerprints":{},"risk":["agent-harness-control-plane"],"side_effects":["repository"]}
---
# HARDEN-05: Machine-addressable artifacts and tickets

## What to deliver

Make ticket metadata stable and machine-addressable; fix QA/evidence locators and tracker semantics.

## Acceptance criteria

- [x] Stable ticket metadata/path semantics exist.
- [x] QA/Evidence locators are unambiguous.
- [x] Commit `2e1cecfcfc13de8c41871b71b1b9fb07478883c1` records the phase.

## Preservation invariants

- Stable IDs survive filenames/navigation changes.

## Allowed write scope

- artifact registry, templates, ticket docs, controller and tests.

## Forbidden write scope

- `main` promotion until final validation.

## Expected change surface

- artifact/ticket addressing assets.

## Canonical sources

- Commit `2e1cecfcfc13de8c41871b71b1b9fb07478883c1`.

## Verification

- Artifact/ticket regression tests and later semantic CI.

## QA disposition

`INDEPENDENT_QA_REQUIRED`

## Stop and replan triggers

- External tracker semantics cannot preserve stable identity/authority.

## Implementation evidence

- commit/ref: `2e1cecfcfc13de8c41871b71b1b9fb07478883c1`

## QA result

- result: `PASS`.

## Delivery

- commit/ref: `2e1cecfcfc13de8c41871b71b1b9fb07478883c1`
- stage: `COMMITTED`
