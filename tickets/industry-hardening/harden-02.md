---yaaw-json
{
  "schema": "yaaw.ticket/v1",
  "id": "HARDEN-02",
  "kind": "DELIVERY",
  "status": "DONE",
  "level": 4,
  "parent": "INIT-INDUSTRY-HARDENING",
  "owner": "orchestrator",
  "blocked_by": [
    "HARDEN-01"
  ],
  "acceptance": [
    "Enforce deterministic ownership, field authority, scope, freshness, leases, budgets and events."
  ],
  "qa": {"required": true, "profile": "HIGH_ASSURANCE"},
  "allowed_write": ["scripts/yaaw/**","scripts/verify_task_scope.py",".agents/authority.json","config/**","tests/harness/**"],
  "forbidden_write": ["main branch promotion without final validation"],
  "expected_change_surface": ["scripts/yaaw/**","scripts/verify_task_scope.py",".agents/authority.json","config/**","tests/harness/**"],
  "source_fingerprints": {},"risk":["agent-harness-control-plane"],"side_effects":["repository"]
}
---
# HARDEN-02: Ownership authority scope and runtime budgets

## What to deliver

Enforce deterministic ownership, field authority, scope, freshness, leases, budgets and events.

## Acceptance criteria

- [x] Enforce deterministic ownership, field authority, scope, freshness, leases, budgets and events.
- [x] The coherent change is recorded as `08a848deecbb8917400da5387568b321a1be412b`.

## Preservation invariants

- Core yaaw-SE authority boundaries remain intact.
- Completed history is not rewritten.

## Allowed write scope

- `scripts/yaaw/**`
- `scripts/verify_task_scope.py`
- `.agents/authority.json`
- `config/**`
- `tests/harness/**`

## Forbidden write scope

- `main` promotion until the complete hardening initiative passes final validation.

## Expected change surface

- controller, authority, scope and test surfaces listed in metadata.

## Canonical sources

- Initiative: `docs/initiatives/industry-hardening/map.md`
- Commit evidence: `08a848deecbb8917400da5387568b321a1be412b`

## Verification

- GitHub Agent Harness CI associated with this phase or its corrective successor.
- Targeted harness unit/semantic checks appropriate to the phase.

## QA disposition

`INDEPENDENT_QA_REQUIRED`

## Stop and replan triggers

- A new control-plane boundary, authority model, or incompatible source invalidates the bounded phase.
- A failed semantic invariant requires corrective work rather than weakening the validator.

## Implementation evidence

- commit/ref: `08a848deecbb8917400da5387568b321a1be412b`
- outcome: deterministic ownership/authority/scope/runtime budgets.

## QA result

- result: `PASS` or subsequently corrected by an explicit follow-up ticket.
- residual risk: later phases may strengthen the same subsystem without rewriting this historical completion.

## Delivery

- commit/ref: `08a848deecbb8917400da5387568b321a1be412b`
- stage: `COMMITTED`
- branch: `feat/industry-hardening`
