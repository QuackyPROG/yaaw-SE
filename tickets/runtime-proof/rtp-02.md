---yaaw-json
{"schema":"yaaw.ticket/v1","id":"RTP-02","kind":"DELIVERY","status":"BLOCKED","level":3,"parent":"INIT-RUNTIME-PROOF","owner":"orchestrator","blocked_by":["RTP-01"],"acceptance":["Gateway dispatch/action decisions emit correlated structured traces with run, work, actor, action, decision, latency and redacted detail fields.","Metrics are derived from real emitted events and preserve the rule that telemetry is evidence rather than product authority."],"qa":{"required":true,"profile":"INDEPENDENT"},"allowed_write":["scripts/yaaw/**","scripts/report_metrics.py","config/**","tests/harness/**","docs/workflow/**",".agents/**","tickets/runtime-proof/**","docs/initiatives/runtime-proof/**"],"forbidden_write":["persisting secret values","using telemetry as semantic authority"],"expected_change_surface":["scripts/yaaw/**","scripts/report_metrics.py","tests/harness/**","docs/workflow/**"],"source_fingerprints":{},"risk":["observability","privacy"],"side_effects":["repository"]}
---
# RTP-02: Automatic correlated traces

## What to deliver

Instrument the runtime gateway and controller-facing actions with append-only, correlated traces suitable for replay, grading and metrics.

## Acceptance criteria

- [ ] Stable run/trace/span identifiers correlate dispatch, policy decisions, action attempts and outcomes.
- [ ] Sensitive details are redacted before persistence.
- [ ] Trace records include actor/role, work identity, action kind, decision, denial reason, duration and optional token/cost metadata.
- [ ] Metrics summarize actual trace events including denied actions, scope drift, plan churn, QA outcomes and human intervention.
- [ ] Tests prove malformed events fail validation and secret-like values are redacted.

## Verification

Run focused trace/metrics tests and the full Agent Harness.
