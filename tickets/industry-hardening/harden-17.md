---yaaw-json
{"schema":"yaaw.ticket/v1","id":"HARDEN-17","kind":"DELIVERY","status":"DONE","level":4,"parent":"INIT-INDUSTRY-HARDENING","owner":"orchestrator","blocked_by":["HARDEN-16"],"acceptance":["Add QA finding identities/residual-risk/failure-signature conventions, stronger acceptance/plan lint, retrieval/index hooks, artifact indexing/archive policy, and measurable drift/escape metrics."],"qa":{"required":true,"profile":"HIGH_ASSURANCE"},"allowed_write":["scripts/yaaw/**","config/**","docs/workflow/**","docs/templates/**","tests/harness/**","evals/**"],"forbidden_write":["main promotion before final green CI"],"expected_change_surface":["scripts/yaaw/**","config/**","docs/workflow/**","docs/templates/**","tests/harness/**","evals/**"],"source_fingerprints":{"implementation_commit":"9f2d475a82f02a73a3f375293a700e0c9b6a60bf","eval_correction":"398aa16ff686c9738ebe22326e934e67512c22f2","ci_run":"33847519555"},"risk":["agent-harness-control-plane"],"side_effects":["repository"]}
---
# HARDEN-17: Planning, QA, retrieval and lifecycle hardening

## What to deliver

Add QA finding identities/residual-risk/failure-signature conventions, stronger acceptance/plan lint, retrieval/index hooks, artifact indexing/archive policy, and measurable drift/escape metrics.

## Acceptance criteria

- [x] QA findings and residual risk are addressable across repair cycles.
- [x] Repeated failure signatures/livelock are measurable and bounded.
- [x] Acceptance/plan lint catches generic non-observable or horizontal-slop tickets.
- [x] Retrieval contracts expose ownership/symbol/test/history hooks without mandating a vector store.
- [x] Stable-path artifacts can be indexed/archived without breaking identity.
- [x] Plan churn, scope drift, QA escape and human intervention can be measured.

## Preservation invariants

- Metrics diagnose rather than redefine product intent.
- Archive/index operations do not rewrite completed history.

## Allowed write scope

- QA/planning/retrieval/lifecycle controller/docs/tests/evals.

## Forbidden write scope

- `main` promotion before final integration validation.

## Expected change surface

- quality/retrieval/lifecycle surfaces.

## Canonical sources

- initiative map and ADR-001.
- `HARDEN-16` completed through `16ba25f30088c5ea783d3f486fc589a09586525e`.

## Verification

- implementation commit `9f2d475a82f02a73a3f375293a700e0c9b6a60bf`
- initial GitHub Actions run `33847384931`: FAIL in adversarial eval harness after restoring an obsolete recovery API symbol
- corrective commit `398aa16ff686c9738ebe22326e934e67512c22f2`: aligned the scenario with `reconstruct_state` and preserved fail-closed snapshot contradiction semantics
- corrected GitHub Actions run `33847519555`: SUCCESS
- 77 harness unit tests: PASS
- adversarial eval suite including planning lint and provider-neutral retrieval hooks: PASS
- semantic/schema/runtime/state/policy/scope gates: PASS

## QA disposition

`HIGH_ASSURANCE` satisfied by full hosted CI, focused unit coverage, and adversarial scenarios after correcting the eval-harness regression.

## Stop and replan triggers

- Retrieval/index design becomes runtime/provider-specific rather than generic hook-based.

## Implementation evidence

`9f2d475a82f02a73a3f375293a700e0c9b6a60bf` adds stable QA/risk identities, conservative ticket-quality lint, provider-neutral retrieval requests, stable-path artifact index/archive manifests, and diagnostic quality metrics. `398aa16ff686c9738ebe22326e934e67512c22f2` corrects only the eval runner to use the current recovery contract.

## QA result

PASS — corrected hosted run `33847519555` passed every gate. Residual risk: planning lint is intentionally conservative and does not attempt to replace Planner/QA judgment for sophisticated acceptance quality; retrieval hooks specify intent/capability rather than guarantee a specific provider implementation.

## Delivery

Integrated on `feat/industry-hardening` through `398aa16ff686c9738ebe22326e934e67512c22f2`; `main` remains untouched pending `HARDEN-19`.
