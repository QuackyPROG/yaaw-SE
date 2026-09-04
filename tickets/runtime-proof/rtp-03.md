---yaaw-json
{"schema":"yaaw.ticket/v1","id":"RTP-03","kind":"DELIVERY","status":"DONE","level":4,"parent":"INIT-RUNTIME-PROOF","owner":"qa","blocked_by":["RTP-02"],"acceptance":["A provider-neutral evaluation runner executes repeated end-to-end agent trials through a registered runtime adapter and grades both outcome and trace invariants.","Reports compute stochastic reliability and safety/cost metrics without treating deterministic fake-adapter CI as real-provider proof."],"qa":{"required":true,"profile":"HIGH_ASSURANCE"},"allowed_write":["evals/**","scripts/**","config/**","tests/harness/**","docs/workflow/**",".agents/**","tickets/runtime-proof/**","docs/initiatives/runtime-proof/**"],"forbidden_write":["network/model calls from default CI","fabricated model results"],"expected_change_surface":["evals/**","scripts/**","config/**","tests/harness/**","docs/workflow/**"],"source_fingerprints":{"rtp02":"d0b85f201fa743602a1285a163290e7ecc10cee6","rtp02_ci":"33888918032","implementation":"f70108256049eabb86772585ca55e7930b605ec3","implementation_ci":"33889727104"},"risk":["agent-evaluation","stochastic-system"],"side_effects":["repository"]}
---
# RTP-03: Model-in-the-loop evaluation framework

## What to deliver
Add an executable end-to-end trial runner that can invoke a registered command/provider adapter, collect gateway traces and grade both task outcome and workflow conformance over repeated trials.

## Acceptance criteria
- [x] Runtime adapter protocol separates invocation from workflow semantics.
- [x] Trial manifests pin workload, runtime/model identity, attempt count and grader expectations.
- [x] Reports include pass@1, pass@k, pass^k, policy violations, replans, cost/token/latency fields and trial-level evidence.
- [x] Outcome graders and trace graders are distinct.
- [x] CI exercises the entire runner with a deterministic fake adapter; real-provider runs are opt-in and reported as observed external evidence only.
- [x] Missing provider/model metadata prevents empirical-proof claims.

## Preservation invariants
Deterministic harness conformance remains separate from stochastic agent quality; fake adapters never count as external empirical evidence.

## Allowed write scope
Evaluation/runtime adapter code, eval assets, config/schemas, tests/docs and this initiative's durable artifacts.

## Forbidden write scope
No default-CI network/model calls and no fabricated trial/model output.

## Expected change surface
`evals/**`, evaluator/adapter modules, schemas/config, focused tests and evaluation documentation.

## Canonical sources
RTP-01 gateway, RTP-02 traces, existing deterministic eval runner and runtime-adapter registry.

## Stop and replan triggers
No trigger fired. Real command/provider execution remains opt-in and identity-gated outside default CI.

## Implementation evidence
`f70108256049eabb86772585ca55e7930b605ec3` adds provider-neutral adapter/result contracts, deterministic CI adapter, opt-in command adapter with explicit runtime/provider/model identity, distinct outcome/trace graders, `pass@k`/`pass^k`, resource/safety reporting, schema validation and CI wiring.

## QA disposition
HIGH_ASSURANCE satisfied for evaluator implementation by exact-SHA full Agent Harness. The fake-adapter run is evaluator conformance evidence only and is explicitly `SIMULATED`.

## QA result
PASS — Agent Harness run `33889727104` completed successfully for exact SHA `f7010825…`, including the deterministic agent-loop evaluation fixture.

## Verification
All existing gates plus `Run deterministic agent-loop evaluation fixture` passed in run `33889727104`.

## Delivery
DONE — the model/runtime evaluation framework is on `main`; no real model-provider success has been claimed.
