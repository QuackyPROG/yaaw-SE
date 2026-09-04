---yaaw-json
{
  "schema": "yaaw.ticket/v1",
  "id": "HARDEN-14",
  "kind": "DELIVERY",
  "status": "DONE",
  "level": 4,
  "parent": "INIT-INDUSTRY-HARDENING",
  "owner": "orchestrator",
  "blocked_by": ["HARDEN-13"],
  "acceptance": ["Make runtime/model capability requirements, safe fallback, QA diversification, adapter conformance, and lightweight/strict operating modes executable without changing workflow semantics."],
  "qa": {"required": true, "profile": "HIGH_ASSURANCE"},
  "allowed_write": [".codex/**","config/**","scripts/yaaw/**","tests/harness/**","docs/workflow/**"],
  "forbidden_write": ["main promotion before final green CI"],
  "expected_change_surface": [".codex/**","config/**","scripts/yaaw/**","tests/harness/**","docs/workflow/**"],
  "source_fingerprints": {
    "implementation_commit": "423a6c40189c6d7eab7d3e73532fa9ef40b56ac8",
    "ci_run": "33844980211"
  },
  "risk": ["agent-harness-control-plane"],
  "side_effects": ["repository"]
}
---
# HARDEN-14: Runtime profiles, adapter conformance and operating modes

## What to deliver

Make runtime/model capability requirements, safe fallback, QA diversification, adapter conformance, and lightweight/strict operating modes executable without changing workflow semantics.

## Acceptance criteria

- [x] Runtime profiles express required capabilities instead of hardcoding model identity.
- [x] Fallback cannot silently downgrade below required capability.
- [x] L4 QA can require model/profile diversification when available.
- [x] Lightweight and strict modes alter ceremony/gates only within explicit policy bounds.
- [x] Adapter conformance is regression-tested.

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

- implementation commit `423a6c40189c6d7eab7d3e73532fa9ef40b56ac8`
- GitHub Actions run `33844980211`: SUCCESS
- semantic/schema/migration/state/policy/unit/adversarial-eval/scope gates: PASS
- runtime config instances validated against their registered JSON Schemas
- runtime-adapter registry and Codex adapter conformance: PASS

## QA disposition

`HIGH_ASSURANCE` satisfied with a clean hosted CI environment plus orthogonal schema, unit, semantic and adversarial evidence. Live cross-family QA selection remains runtime-dependent by design; the fail-closed/diversification logic is regression-tested and cannot claim provider availability that was not observed.

## Stop and replan triggers

- Supported runtime cannot enforce a required capability boundary.
- Model fallback would reduce mandatory high-assurance capability.

## Implementation evidence

`423a6c40189c6d7eab7d3e73532fa9ef40b56ac8` adds capability-based selection, fail-closed fallback, operating modes, runtime-adapter registry/conformance, schema validation and Codex trust/admission instructions.

## QA result

PASS — all executable gates passed on GitHub Actions run `33844980211`. Residual risk: actual model-family diversity depends on candidates exposed by the consuming runtime; yaaw-SE blocks capability downgrade and requires distinct-family selection when available rather than fabricating availability.

## Delivery

Integrated on `feat/industry-hardening` at `423a6c40189c6d7eab7d3e73532fa9ef40b56ac8`; CI green. `main` remains intentionally untouched pending `HARDEN-19`.
