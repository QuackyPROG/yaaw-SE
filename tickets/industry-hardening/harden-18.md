---yaaw-json
{"schema":"yaaw.ticket/v1","id":"HARDEN-18","kind":"DELIVERY","status":"DRAFT","level":4,"parent":"INIT-INDUSTRY-HARDENING","owner":"orchestrator","blocked_by":["HARDEN-17"],"acceptance":["Provide executable L0-L4 examples, STOP_AND_REPLAN/QA repair/stale-source/unknown-owner examples, complete controller/security/recovery docs, and precise maturity claims."],"qa":{"required":true,"profile":"HIGH_ASSURANCE"},"allowed_write":["examples/**","docs/**","README.md","tests/harness/**","evals/**"],"forbidden_write":["main promotion before final green CI"],"expected_change_surface":["examples/**","docs/**","README.md","tests/harness/**","evals/**"],"source_fingerprints":{},"risk":["agent-harness-control-plane"],"side_effects":["repository"]}
---
# HARDEN-18: Complete examples, failure cases and public maturity documentation

## What to deliver

Provide executable L0-L4 examples, STOP_AND_REPLAN/QA repair/stale-source/unknown-owner examples, complete controller/security/recovery docs, and precise maturity claims.

## Acceptance criteria

- [ ] L0-L4 examples demonstrate actual structured artifacts/controller behavior.
- [ ] Failure examples cover replanning, QA repair, stale evidence and unknown ownership.
- [ ] Public docs distinguish enforced invariants from agent judgment and runtime-dependent capability.
- [ ] Maturity status makes no unsupported production-autonomy claim.

## Preservation invariants

- Examples are validated fixtures, not decorative pseudocode presented as proof.

## Allowed write scope

- examples/docs/README/tests/evals.

## Forbidden write scope

- `main` promotion before final integration validation.

## Expected change surface

- public and executable documentation surfaces.

## Canonical sources

- initiative map and full hardening history.

## Verification

- example validation plus full harness CI.

## QA disposition

`INDEPENDENT_QA_REQUIRED` with `HIGH_ASSURANCE` profile.

## Stop and replan triggers

- Docs claim a guarantee not enforced or empirically validated.

## Implementation evidence

Pending.

## QA result

Pending.

## Delivery

Pending.
