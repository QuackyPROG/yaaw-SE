---yaaw-json
{"schema":"yaaw.ticket/v1","id":"HARDEN-10","kind":"DELIVERY","status":"DONE","level":4,"parent":"INIT-INDUSTRY-HARDENING","owner":"orchestrator","blocked_by":["HARDEN-09"],"acceptance":["Make the harness self-hosting by explicitly owning controller, schema, test, example and eval surfaces."],"qa":{"required":true,"profile":"HIGH_ASSURANCE"},"allowed_write":[".agents/ownership.json"],"forbidden_write":["main branch promotion without final validation"],"expected_change_surface":[".agents/ownership.json"],"source_fingerprints":{},"risk":["agent-harness-control-plane"],"side_effects":["repository"]}
---
# HARDEN-10: Register deterministic harness ownership

## What to deliver

Make the harness self-hosting by explicitly owning controller, schema, test, example and eval surfaces.

## Acceptance criteria

- [x] Core controller/schema/test/eval paths do not resolve `UNKNOWN_OWNER`.
- [x] Commit `bb2622f687c036e072f8f4e7c856cb725e50917d` records the phase.

## Preservation invariants

- Ownership remains explicit and deterministic.

## Allowed write scope

- `.agents/ownership.json`

## Forbidden write scope

- `main` promotion until final validation.

## Expected change surface

- ownership registry only.

## Canonical sources

- Commit `bb2622f687c036e072f8f4e7c856cb725e50917d`.

## Verification

- ownership resolver and semantic CI.

## QA disposition

`INDEPENDENT_QA_REQUIRED`

## Stop and replan triggers

- Equal-specificity conflicting ownership is introduced.

## Implementation evidence

- commit/ref: `bb2622f687c036e072f8f4e7c856cb725e50917d`

## QA result

- result: `PASS`.

## Delivery

- commit/ref: `bb2622f687c036e072f8f4e7c856cb725e50917d`
- stage: `COMMITTED`
