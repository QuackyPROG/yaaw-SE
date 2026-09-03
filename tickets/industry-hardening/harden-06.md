---yaaw-json
{"schema":"yaaw.ticket/v1","id":"HARDEN-06","kind":"DELIVERY","status":"DONE","level":4,"parent":"INIT-INDUSTRY-HARDENING","owner":"orchestrator","blocked_by":["HARDEN-05"],"acceptance":["Reduce agent prompt duplication, centralize procedures in skills and generate bounded context capsules."],"qa":{"required":true,"profile":"HIGH_ASSURANCE"},"allowed_write":[".agents/agents/**",".agents/skills/**","scripts/yaaw/context.py","tests/harness/**"],"forbidden_write":["main branch promotion without final validation"],"expected_change_surface":[".agents/agents/**",".agents/skills/**","scripts/yaaw/context.py","tests/harness/**"],"source_fingerprints":{},"risk":["agent-harness-control-plane"],"side_effects":["repository"]}
---
# HARDEN-06: Separate role authority from procedural skills

## What to deliver

Reduce agent prompt duplication, centralize procedures in skills and generate bounded context capsules.

## Acceptance criteria

- [x] Agents primarily define authority/identity; skills define method.
- [x] Ticket-graph is a compatibility shim rather than duplicate planning brain.
- [x] Commit `4bbbf71cfa9c9d881f76355c9549895188c3dc6b` records the phase.

## Preservation invariants

- Role authority remains explicit and registered.

## Allowed write scope

- registered role/skill/context surfaces.

## Forbidden write scope

- `main` promotion until final validation.

## Expected change surface

- role and procedural prompt assets.

## Canonical sources

- Commit `4bbbf71cfa9c9d881f76355c9549895188c3dc6b`.

## Verification

- Harness tests and catalog/asset validation.

## QA disposition

`INDEPENDENT_QA_REQUIRED`

## Stop and replan triggers

- Simplification removes a required authority boundary.

## Implementation evidence

- commit/ref: `4bbbf71cfa9c9d881f76355c9549895188c3dc6b`

## QA result

- result: `PASS`.

## Delivery

- commit/ref: `4bbbf71cfa9c9d881f76355c9549895188c3dc6b`
- stage: `COMMITTED`
