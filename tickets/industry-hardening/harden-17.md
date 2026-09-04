---yaaw-json
{"schema":"yaaw.ticket/v1","id":"HARDEN-17","kind":"DELIVERY","status":"READY","level":4,"parent":"INIT-INDUSTRY-HARDENING","owner":"orchestrator","blocked_by":["HARDEN-16"],"acceptance":["Add QA finding identities/residual-risk/failure-signature conventions, stronger acceptance/plan lint, retrieval/index hooks, artifact indexing/archive policy, and measurable drift/escape metrics."],"qa":{"required":true,"profile":"HIGH_ASSURANCE"},"allowed_write":["scripts/yaaw/**","config/**","docs/workflow/**","docs/templates/**","tests/harness/**","evals/**"],"forbidden_write":["main promotion before final green CI"],"expected_change_surface":["scripts/yaaw/**","config/**","docs/workflow/**","docs/templates/**","tests/harness/**","evals/**"],"source_fingerprints":{"blocked_by_harden_16":"16ba25f30088c5ea783d3f486fc589a09586525e"},"risk":["agent-harness-control-plane"],"side_effects":["repository"]}
---
# HARDEN-17: Planning, QA, retrieval and lifecycle hardening

## What to deliver

Add QA finding identities/residual-risk/failure-signature conventions, stronger acceptance/plan lint, retrieval/index hooks, artifact indexing/archive policy, and measurable drift/escape metrics.

## Acceptance criteria

- [ ] QA findings and residual risk are addressable across repair cycles.
- [ ] Repeated failure signatures/livelock are measurable and bounded.
- [ ] Acceptance/plan lint catches generic non-observable or horizontal-slop tickets.
- [ ] Retrieval contracts expose ownership/symbol/test/history hooks without mandating a vector store.
- [ ] Stable-path artifacts can be indexed/archived without breaking identity.
- [ ] Plan churn, scope drift, QA escape and human intervention can be measured.

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

- focused unit/eval coverage plus full harness CI.

## QA disposition

`INDEPENDENT_QA_REQUIRED` with `HIGH_ASSURANCE` profile.

## Stop and replan triggers

- Retrieval/index design becomes runtime/provider-specific rather than generic hook-based.

## Implementation evidence

Pending.

## QA result

Pending independent/high-assurance evidence.

## Delivery

Pending.
