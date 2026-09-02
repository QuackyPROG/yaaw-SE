# <ID>: <Delivery title>

**Kind:** DELIVERY
**Status:** DRAFT | BLOCKED | READY | IN_PROGRESS | VERIFYING | DONE | SUPERSEDED | CANCELLED
**Parent:** <initiative/spec optional>
**Blocked by:** <ids/titles or none>
**Owner / subsystem:** <owner>
**Level:** L0 | L1 | L2 | L3 | L4

## What to deliver

Describe one bounded, preferably vertical, externally verifiable behavior/outcome.

## Acceptance criteria

- [ ] ...
- [ ] ...

## Preservation invariants

What must remain true while delivering this change?

- ...

## Allowed write scope

- `pattern/**`

## Forbidden write scope

- `other-owner/**`

## Expected change surface

Paths/modules/interfaces that are reasonably expected to change. Deviations require explanation before QA admission.

- `expected/**`

## Canonical sources

- relevant PRD/spec/ADR/decision/interface
- freshness checked at: <ref/time or state>

## Verification

Risk-bearing behavior first.

- targeted command/seam:
- negative/error/retry/concurrency checks when relevant:
- broader checks when required:
- real dependency/integration seam when risk justifies it:

## QA

`QA_NOT_REQUIRED_BY_ROUTE` | `INDEPENDENT_QA_REQUIRED`

## Stop and replan triggers

List material scope/assumption conditions specific to this ticket in addition to global policy, including stale sources or violated preservation invariants.

## Implementation evidence

- changed paths:
- expected-vs-actual surface deviations + explanation:
- preservation invariants:
- commands/results:
- material finding confidence (`CONFIRMED` / `SUPPORTED` / `SUSPECTED` / `UNKNOWN`):

## QA

- result:
- evidence-backed findings:
- risk coverage:

## Delivery

- commit/ref:
- commit outcome:
- CI/provider state:
- promotion/release state:
