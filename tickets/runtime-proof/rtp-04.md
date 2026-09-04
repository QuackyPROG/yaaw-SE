---yaaw-json
{"schema":"yaaw.ticket/v1","id":"RTP-04","kind":"DELIVERY","status":"BLOCKED","level":3,"parent":"INIT-RUNTIME-PROOF","owner":"qa","blocked_by":["RTP-03"],"acceptance":["External workload manifests and portability contracts can compare plain-runtime baseline versus yaaw-SE-governed runs across unrelated repositories without provider-specific workflow assumptions.","Evidence schemas distinguish NOT_RUN/UNPROVEN from observed results and require immutable workload/runtime/commit fingerprints for empirical claims."],"qa":{"required":true,"profile":"INDEPENDENT"},"allowed_write":["evals/**","examples/**","scripts/**","config/**","tests/harness/**","docs/workflow/**",".agents/**","tickets/runtime-proof/**","docs/initiatives/runtime-proof/**"],"forbidden_write":["fabricated external repository results","implicit credential/network access"],"expected_change_surface":["evals/**","examples/**","scripts/**","config/**","tests/harness/**","docs/workflow/**"],"source_fingerprints":{},"risk":["external-evidence","runtime-portability"],"side_effects":["repository"]}
---
# RTP-04: External workload and portability framework

## What to deliver

Create workload/evidence contracts for unrelated repositories and a generic command-runtime adapter so yaaw-SE can be evaluated against a plain-runtime baseline without changing workflow semantics.

## Acceptance criteria

- [ ] Workload manifests pin repository/ref, task, allowed scope, verification and grading seams.
- [ ] A second generic command-runtime adapter satisfies the same invocation protocol as the Codex-oriented adapter surface.
- [ ] Comparison reports pair baseline and governed trials and compute deltas without hiding failed/blocked trials.
- [ ] External evidence records require runtime/model/workload/commit fingerprints and explicit observation status.
- [ ] `NOT_RUN`, `BLOCKED`, `FAILED`, and `OBSERVED` remain distinguishable.
- [ ] Example workloads are synthetic/local fixtures only unless actual external evidence is committed with provenance.

## Verification

Run portability/comparison fixtures and the full Agent Harness.
