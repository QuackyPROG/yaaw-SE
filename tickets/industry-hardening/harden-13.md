---yaaw-json
{"schema":"yaaw.ticket/v1","id":"HARDEN-13","kind":"DELIVERY","status":"DONE","level":4,"parent":"INIT-INDUSTRY-HARDENING","owner":"orchestrator","blocked_by":["HARDEN-12"],"acceptance":["Add adversarial conformance scenarios, long-horizon graph checks and runtime metrics; run evals in CI."],"qa":{"required":true,"profile":"HIGH_ASSURANCE"},"allowed_write":["evals/**","scripts/run_evals.py","scripts/report_metrics.py","scripts/yaaw/metrics.py",".github/workflows/agent-harness.yml","tests/harness/**"],"forbidden_write":["main branch promotion without final validation"],"expected_change_surface":["evals/**","scripts/run_evals.py","scripts/report_metrics.py","scripts/yaaw/metrics.py",".github/workflows/agent-harness.yml","tests/harness/**"],"source_fingerprints":{},"risk":["agent-harness-control-plane"],"side_effects":["repository"]}
---
# HARDEN-13: Adversarial conformance evals and metrics

## What to deliver

Add adversarial conformance scenarios, long-horizon graph checks and runtime metrics; run evals in CI.

## Acceptance criteria

- [x] Known routing/security/authority/scope/graph/history/evidence failure classes are regression scenarios.
- [x] A 100-ticket graph scenario computes the frontier deterministically.
- [x] GitHub Actions run `33803976676` passes the adversarial suite and all other harness gates.

## Preservation invariants

- Generic evals do not replace consuming-project tests.
- Runtime metrics do not become product intent.

## Allowed write scope

- eval, metrics, CI and harness test surfaces.

## Forbidden write scope

- `main` promotion until final validation.

## Expected change surface

- conformance/metrics assets.

## Canonical sources

- Commit `d66e5bd7f61a8508220afe8d5e37f55d6b6199e6`.
- GitHub Actions run `33803976676`.

## Verification

- All semantic/schema/state/policy/unit/eval/scope gates pass in run `33803976676`.

## QA disposition

`INDEPENDENT_QA_REQUIRED`

## Stop and replan triggers

- An eval failure reveals a real policy or controller defect.

## Implementation evidence

- commit/ref: `d66e5bd7f61a8508220afe8d5e37f55d6b6199e6`

## QA result

- result: `PASS`.

## Delivery

- commit/ref: `d66e5bd7f61a8508220afe8d5e37f55d6b6199e6`
- stage: `COMMITTED`
