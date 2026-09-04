---yaaw-json
{"schema":"yaaw.ticket/v1","id":"RTP-02","kind":"DELIVERY","status":"DONE","level":3,"parent":"INIT-RUNTIME-PROOF","owner":"orchestrator","blocked_by":["RTP-01"],"acceptance":["Gateway dispatch/action decisions emit correlated structured traces with run, work, actor, action, decision, latency and redacted detail fields.","Metrics are derived from real emitted events and preserve the rule that telemetry is evidence rather than product authority."],"qa":{"required":true,"profile":"INDEPENDENT"},"allowed_write":["scripts/yaaw/**","scripts/report_metrics.py","config/**","tests/harness/**","docs/workflow/**",".agents/**","tickets/runtime-proof/**","docs/initiatives/runtime-proof/**"],"forbidden_write":["persisting secret values","using telemetry as semantic authority"],"expected_change_surface":["scripts/yaaw/**","scripts/report_metrics.py","tests/harness/**","docs/workflow/**"],"source_fingerprints":{"rtp01":"68405b4652ea3a547a48fb9939e3cf130ba5cbae","rtp01_ci":"33888436897","implementation":"d0b85f201fa743602a1285a163290e7ecc10cee6","implementation_ci":"33888918032"},"risk":["observability","privacy"],"side_effects":["repository"]}
---
# RTP-02: Automatic correlated traces

## What to deliver
Instrument the runtime gateway and controller-facing actions with append-only, correlated traces suitable for replay, grading and metrics.

## Acceptance criteria
- [x] Stable run/trace/span identifiers correlate dispatch, policy decisions, action attempts and outcomes.
- [x] Sensitive details are redacted before persistence.
- [x] Trace records include actor/role, work identity, action kind, decision, denial reason, duration and optional token/cost metadata.
- [x] Metrics summarize actual trace events including denied actions, scope drift, plan churn, QA outcomes and human intervention.
- [x] Tests prove malformed events fail validation and secret-like values are redacted.

## Preservation invariants
Telemetry is runtime evidence only; it cannot mutate product intent or workflow authority.

## Allowed write scope
Runtime event/metrics modules, reporting script, tests, workflow docs/config and this initiative's durable artifacts.

## Forbidden write scope
Never persist unredacted secrets and never grant semantic authority based on telemetry.

## Expected change surface
`scripts/yaaw/events.py`, `scripts/yaaw/metrics.py`, gateway instrumentation, reporting/tests/docs.

## Canonical sources
RTP-01 gateway behavior, existing event/metrics modules, event schema and root trust/secrets policy.

## Stop and replan triggers
No trigger fired. Trace persistence remains explicitly ephemeral and non-authoritative.

## Implementation evidence
`d0b85f201fa743602a1285a163290e7ecc10cee6` adds `TraceContext`, recursively redacted validated events, gateway lifecycle spans, action latency/error tracing, event-schema correlation rules, metrics and focused tests.

## QA disposition
INDEPENDENT satisfied by exact-SHA full Agent Harness; no secret/provider data was required.

## QA result
PASS — validation job for Agent Harness run `33888918032` succeeded for exact SHA `d0b85f20…`.

## Verification
All repository-defined gates plus tracing/metrics regressions passed in run `33888918032`.

## Delivery
DONE — correlated runtime tracing is on `main`; telemetry remains evidence rather than authority.
