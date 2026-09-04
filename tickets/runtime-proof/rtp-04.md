---yaaw-json
{"schema":"yaaw.ticket/v1","id":"RTP-04","kind":"DELIVERY","status":"DONE","level":3,"parent":"INIT-RUNTIME-PROOF","owner":"qa","blocked_by":["RTP-03"],"acceptance":["External workload manifests and portability contracts can compare plain-runtime baseline versus yaaw-SE-governed runs across unrelated repositories without provider-specific workflow assumptions.","Evidence schemas distinguish NOT_RUN/UNPROVEN from observed results and require immutable workload/runtime/commit fingerprints for empirical claims."],"qa":{"required":true,"profile":"INDEPENDENT"},"allowed_write":["evals/**","examples/**","scripts/**","config/**","tests/harness/**","docs/workflow/**",".agents/**","tickets/runtime-proof/**","docs/initiatives/runtime-proof/**"],"forbidden_write":["fabricated external repository results","implicit credential/network access"],"expected_change_surface":["evals/**","examples/**","scripts/**","config/**","tests/harness/**","docs/workflow/**"],"source_fingerprints":{"rtp03":"f70108256049eabb86772585ca55e7930b605ec3","rtp03_ci":"33889727104","implementation":"7a92adc0aef40d8d5f9aebf2feeb1c13218154d3","implementation_ci":"33891024080"},"risk":["external-evidence","runtime-portability"],"side_effects":["repository"]}
---
# RTP-04: External workload and portability framework

## What to deliver
Create workload/evidence contracts for unrelated repositories and a generic command-runtime adapter so yaaw-SE can be evaluated against a plain-runtime baseline without changing workflow semantics.

## Acceptance criteria
- [x] Workload manifests pin repository/ref, task, allowed scope, verification and grading seams.
- [x] A second generic command-runtime adapter satisfies the same invocation protocol as the Codex-oriented adapter surface.
- [x] Comparison reports pair baseline and governed trials and compute deltas without hiding failed/blocked trials.
- [x] External evidence records require runtime/model/workload/commit fingerprints and explicit observation status.
- [x] `NOT_RUN`, `BLOCKED`, `FAILED`, and `OBSERVED` remain distinguishable.
- [x] Example workloads are synthetic/local fixtures only unless actual external evidence is committed with provenance.

## Preservation invariants
Provider portability may change invocation plumbing, never routing/authority/scope/QA semantics.

## Allowed write scope
Evaluation/workload assets, examples, runtime adapter/config/schema code, tests/docs and this initiative's durable artifacts.

## Forbidden write scope
No fabricated external results and no implicit credential/network use.

## Expected change surface
Workload/comparison schemas and runner code, generic command adapter registration, local fixtures, tests/docs.

## Canonical sources
RTP-03 trial runner, runtime adapter registry/schema, evidence/trust/maturity policies.

## Stop and replan triggers
No trigger fired. The generic adapter remains a protocol contract and explicitly requires an external gateway-enforcing wrapper rather than weakening yaaw-SE semantics.

## Implementation evidence
`7a92adc0aef40d8d5f9aebf2feeb1c13218154d3` adds pinned workload provenance and fingerprints, explicit evidence statuses/proof classification, baseline/governed delta reporting, the second registered generic-command adapter, schemas, local synthetic fixtures, focused tests and CI validation. The synthetic governed improvement remains `UNPROVEN` by construction.

## QA disposition
INDEPENDENT satisfied by exact-SHA full Agent Harness, including the new generic-runtime validator and synthetic workload comparison.

## QA result
PASS — Agent Harness run `33891024080` completed successfully for exact implementation SHA `7a92adc0…`.

## Verification
All repository-defined schema/semantic/runtime/state/policy/unit/eval/comparison/scope gates passed in run `33891024080`.

## Delivery
DONE — portability/provenance machinery is on `main`; no external workload or provider success is claimed.
