---yaaw-json
{
  "schema": "yaaw.ticket/v1",
  "id": "DEL-000",
  "kind": "DELIVERY",
  "status": "DRAFT",
  "level": 1,
  "parent": null,
  "owner": "UNKNOWN_OWNER",
  "blocked_by": [],
  "acceptance": [],
  "qa": {"required": false, "profile": "SELF_VERIFY"},
  "allowed_write": [],
  "forbidden_write": [],
  "expected_change_surface": [],
  "source_fingerprints": {},
  "risk": [],
  "side_effects": []
}
---
# DEL-000: Delivery title

## What to deliver

One bounded, preferably vertical, externally verifiable behavior or outcome.

## Acceptance criteria

Mirror observable criteria in machine metadata above.

- [ ] ...

## Preservation invariants

- ...

## Allowed write scope

- `pattern/**`

## Forbidden write scope

- `other-owner/**`

## Expected change surface

- `expected/**`

## Canonical sources

- PRD/spec/ADR/decision/interface plus immutable fingerprint/reference.

## Verification

- named domain-pack verification IDs and/or exact commands;
- risk-bearing behavior first;
- negative/error/retry/concurrency/real-integration checks when relevant.

## QA disposition

`QA_NOT_REQUIRED_BY_ROUTE` | `INDEPENDENT_QA_REQUIRED` | `HIGH_ASSURANCE_QA_REQUIRED`

## Stop and replan triggers

- stale source fingerprint;
- owner/subsystem boundary change;
- material acceptance or architecture change;
- new destructive/provider/trust-boundary side effect;
- preservation invariant violation.

## Implementation evidence

- changed paths:
- expected-vs-actual deviations:
- commands/results with commit/environment:
- preservation evidence:
- confidence / remaining unknowns:

## QA result

- result: `PASS` | `REPAIR_REQUIRED` | `STOP_AND_REPLAN`
- finding IDs:
- orthogonal evidence:
- residual risks:

## Delivery

- base/head commit:
- coherent outcome:
- CI/provider observation:
- integration target:
- environment/promotion state:
- rollback/recovery reference when required:
