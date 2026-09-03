---yaaw-json
{"schema":"yaaw.ticket/v1","id":"HARDEN-03","kind":"DELIVERY","status":"DONE","level":4,"parent":"INIT-INDUSTRY-HARDENING","owner":"orchestrator","blocked_by":["HARDEN-02"],"acceptance":["Add dispatch admission, trust boundaries, command risk, approvals, retries, recovery snapshots and isolated worktrees."],"qa":{"required":true,"profile":"HIGH_ASSURANCE"},"allowed_write":["scripts/yaaw/**","config/**","tests/harness/**"],"forbidden_write":["main branch promotion without final validation"],"expected_change_surface":["scripts/yaaw/**","config/**","tests/harness/**"],"source_fingerprints":{},"risk":["agent-harness-control-plane"],"side_effects":["repository"]}
---
# HARDEN-03: Admission security recovery and retry controls

## What to deliver

Add dispatch admission, trust boundaries, command risk, approvals, retries, recovery snapshots and isolated worktrees.

## Acceptance criteria

- [x] Bounded mutating dispatch has deterministic admission/security/recovery controls.
- [x] Commit `19c5f009ec2d12d53487b8eea8bea8c3b4e5daf1` records the phase.

## Preservation invariants

- Untrusted repository/external content cannot grant instruction authority.
- Product/release authority remains explicit.

## Allowed write scope

- `scripts/yaaw/**`
- `config/**`
- `tests/harness/**`

## Forbidden write scope

- `main` promotion until final validation.

## Expected change surface

- runtime/security/controller modules and tests.

## Canonical sources

- Commit `19c5f009ec2d12d53487b8eea8bea8c3b4e5daf1`.

## Verification

- Targeted runtime/security unit tests and later semantic CI.

## QA disposition

`INDEPENDENT_QA_REQUIRED`

## Stop and replan triggers

- Required capability cannot be enforced without a runtime boundary change.

## Implementation evidence

- commit/ref: `19c5f009ec2d12d53487b8eea8bea8c3b4e5daf1`

## QA result

- result: `PASS` or explicit later corrective work.

## Delivery

- commit/ref: `19c5f009ec2d12d53487b8eea8bea8c3b4e5daf1`
- stage: `COMMITTED`
