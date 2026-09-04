---yaaw-json
{"schema":"yaaw.ticket/v1","id":"HARDEN-18","kind":"DELIVERY","status":"DONE","level":4,"parent":"INIT-INDUSTRY-HARDENING","owner":"orchestrator","blocked_by":["HARDEN-17"],"acceptance":["Provide executable L0-L4 examples, STOP_AND_REPLAN/QA repair/stale-source/unknown-owner examples, complete controller/security/recovery docs, and precise maturity claims."],"qa":{"required":true,"profile":"HIGH_ASSURANCE"},"allowed_write":["examples/**","docs/**","README.md","tests/harness/**","evals/**"],"forbidden_write":["main promotion before final green CI"],"expected_change_surface":["examples/**","docs/**","README.md","tests/harness/**","evals/**"],"source_fingerprints":{"implementation_commit":"7e1145b47683adfddfb59d5517c1306d23bb40b7","ci_run":"33847823831"},"risk":["agent-harness-control-plane"],"side_effects":["repository"]}
---
# HARDEN-18: Complete examples, failure cases and public maturity documentation

## What to deliver

Provide executable L0-L4 examples, STOP_AND_REPLAN/QA repair/stale-source/unknown-owner examples, complete controller/security/recovery docs, and precise maturity claims.

## Acceptance criteria

- [x] L0-L4 examples demonstrate actual structured artifacts/controller behavior.
- [x] Failure examples cover replanning, QA repair, stale evidence and unknown ownership.
- [x] Public docs distinguish enforced invariants from agent judgment and runtime-dependent capability.
- [x] Maturity status makes no unsupported production-autonomy claim.

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
- `HARDEN-17` implementation through `398aa16ff686c9738ebe22326e934e67512c22f2` with hosted CI run `33847519555` green.

## Verification

- implementation commit `7e1145b47683adfddfb59d5517c1306d23bb40b7`
- GitHub Actions run `33847823831`: SUCCESS
- executable L0-L4 routing/artifact fixtures: PASS
- STOP_AND_REPLAN, QA repair, stale evidence and UNKNOWN_OWNER failure fixtures: PASS
- public maturity regression checks: PASS
- full semantic/schema/runtime/state/policy/unit/adversarial/scope gates: PASS

## QA disposition

`HIGH_ASSURANCE` satisfied by hosted CI using the same router/controller/evidence/state primitives demonstrated by the examples.

## Stop and replan triggers

- Docs claim a guarantee not enforced or empirically validated.

## Implementation evidence

`7e1145b47683adfddfb59d5517c1306d23bb40b7` adds CI-executed L0-L4 and failure-path fixtures plus controller/security/recovery/maturity documentation. README explicitly labels the harness Beta/self-hosting and separates machine-enforced, agent-judgment and runtime-dependent guarantees.

## QA result

PASS — hosted run `33847823831` passed every gate. Residual risk: examples prove the named generic control paths, not every consuming project/runtime/provider behavior.

## Delivery

Integrated on `feat/industry-hardening` through `7e1145b47683adfddfb59d5517c1306d23bb40b7`; `main` remains untouched pending `HARDEN-19`.
