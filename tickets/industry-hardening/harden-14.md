---yaaw-json
{
  "schema": "yaaw.ticket/v1",
  "id": "HARDEN-14",
  "kind": "DELIVERY",
  "status": "READY",
  "level": 4,
  "parent": "INIT-INDUSTRY-HARDENING",
  "owner": "orchestrator",
  "blocked_by": ["HARDEN-13"],
  "acceptance": ["Make runtime/model capability requirements, safe fallback, QA diversification, adapter conformance, and lightweight/strict operating modes executable without changing workflow semantics."],
  "qa": {"required": true, "profile": "HIGH_ASSURANCE"},
  "allowed_write": [".codex/**","config/**","scripts/yaaw/**","tests/harness/**","docs/workflow/**"],
  "forbidden_write": ["main promotion before final green CI"],
  "expected_change_surface": [".codex/**","config/**","scripts/yaaw/**","tests/harness/**","docs/workflow/**"],
  "source_fingerprints": {},
  "risk": ["agent-harness-control-plane"],
  "side_effects": ["repository"]
}
---
# HARDEN-14: Runtime profiles, adapter conformance and operating modes

## What to deliver

Make runtime/model capability requirements, safe fallback, QA diversification, adapter conformance, and lightweight/strict operating modes executable without changing workflow semantics.

## Acceptance criteria

- [ ] Runtime profiles express required capabilities instead of hardcoding model identity.
- [ ] Fallback cannot silently downgrade below required capability.
- [ ] L4 QA can require model/profile diversification when available.
- [ ] Lightweight and strict modes alter ceremony/gates only within explicit policy bounds.
- [ ] Adapter conformance is regression-tested.

## Preservation invariants

- Model/runtime choice cannot alter workflow authority semantics.
- L0/L1 remains cheap when risk allows it.
- Strict mode may strengthen gates but cannot silently grant authority.

## Allowed write scope

- `.codex/**`
- `config/**`
- `scripts/yaaw/**`
- `tests/harness/**`
- `docs/workflow/**`

## Forbidden write scope

- `main` promotion before final integration validation.

## Expected change surface

- runtime profiles, adapter policy, controller validation and tests.

## Canonical sources

- `docs/initiatives/industry-hardening/map.md`
- `ADR-001`
- current `feat/industry-hardening` branch state and CI evidence

## Verification

- semantic validators
- runtime/model policy unit tests
- adapter conformance tests
- adversarial evals

## QA disposition

`INDEPENDENT_QA_REQUIRED` with `HIGH_ASSURANCE` profile.

## Stop and replan triggers

- Supported runtime cannot enforce a required capability boundary.
- Model fallback would reduce mandatory high-assurance capability.

## Implementation evidence

Pending.

## QA result

Pending independent QA.

## Delivery

Pending coherent commit/integration evidence.
