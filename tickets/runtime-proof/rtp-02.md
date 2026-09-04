---yaaw-json
{"schema":"yaaw.ticket/v1","id":"RTP-02","kind":"DELIVERY","status":"IN_PROGRESS","level":3,"parent":"INIT-RUNTIME-PROOF","owner":"orchestrator","blocked_by":["RTP-01"],"acceptance":["Gateway dispatch/action decisions emit correlated structured traces with run, work, actor, action, decision, latency and redacted detail fields.","Metrics are derived from real emitted events and preserve the rule that telemetry is evidence rather than product authority."],"qa":{"required":true,"profile":"INDEPENDENT"},"allowed_write":["scripts/yaaw/**","scripts/report_metrics.py","config/**","tests/harness/**","docs/workflow/**",".agents/**","tickets/runtime-proof/**","docs/initiatives/runtime-proof/**"],"forbidden_write":["persisting secret values","using telemetry as semantic authority"],"expected_change_surface":["scripts/yaaw/**","scripts/report_metrics.py","tests/harness/**","docs/workflow/**"],"source_fingerprints":{"rtp01":"68405b4652ea3a547a48fb9939e3cf130ba5cbae","rtp01_ci":"33888436897","frontier_commit":"4cc0cba08ee04aa765eb171648d8706a3c6a9587"},"risk":["observability","privacy"],"side_effects":["repository"]}
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
Required trace fields would expose secrets, trace persistence conflicts with runtime isolation, or correlation semantics cannot survive recovery/retry safely.

## Implementation evidence
Candidate adds trace contexts, recursive redaction/validation, gateway lifecycle events, action latency/error spans and extended diagnostic metrics. Exact-SHA CI pending.

## QA disposition
INDEPENDENT required; candidate is not DONE until full Agent Harness is green.

## QA result
Pending exact-SHA CI.

## Verification
Run focused trace/metrics tests and the full Agent Harness.

## Delivery
IN_PROGRESS — candidate being validated; telemetry remains ephemeral evidence only.
