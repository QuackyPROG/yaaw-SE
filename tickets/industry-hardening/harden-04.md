---yaaw-json
{"schema":"yaaw.ticket/v1","id":"HARDEN-04","kind":"DELIVERY","status":"DONE","level":4,"parent":"INIT-INDUSTRY-HARDENING","owner":"orchestrator","blocked_by":["HARDEN-03"],"acceptance":["Formalize versioned domain packs, repository maps, verification contracts, criticality and HOTFIX routing."],"qa":{"required":true,"profile":"HIGH_ASSURANCE"},"allowed_write":["scripts/yaaw/**",".agents/router.json",".agents/schemas/**","examples/domain-pack/**","docs/domain-packs.md","tests/harness/**"],"forbidden_write":["main branch promotion without final validation"],"expected_change_surface":["scripts/yaaw/**",".agents/router.json",".agents/schemas/**","examples/domain-pack/**","docs/domain-packs.md","tests/harness/**"],"source_fingerprints":{},"risk":["agent-harness-control-plane"],"side_effects":["repository"]}
---
# HARDEN-04: Formal domain packs and risk-aware routing

## What to deliver

Formalize versioned domain packs, repository maps, verification contracts, criticality and HOTFIX routing.

## Acceptance criteria

- [x] Domain/project facts have a versioned extension contract.
- [x] Planning complexity is separated from consequence risk.
- [x] Commit `f8e6f0bb0ca89dd51700bc6ef1783eaa9d75fe26` records the phase.

## Preservation invariants

- Generic invariants cannot be silently weakened by a domain pack.
- Tiny safe work remains eligible for a cheap route.

## Allowed write scope

- domain pack, routing, schema, docs and test surfaces listed in metadata.

## Forbidden write scope

- `main` promotion until final validation.

## Expected change surface

- domain pack/routing assets.

## Canonical sources

- Commit `f8e6f0bb0ca89dd51700bc6ef1783eaa9d75fe26`.

## Verification

- Domain-pack/routing unit tests and subsequent CI.

## QA disposition

`INDEPENDENT_QA_REQUIRED`

## Stop and replan triggers

- A project extension requires weakening a generic safety invariant.

## Implementation evidence

- commit/ref: `f8e6f0bb0ca89dd51700bc6ef1783eaa9d75fe26`

## QA result

- result: `PASS`.

## Delivery

- commit/ref: `f8e6f0bb0ca89dd51700bc6ef1783eaa9d75fe26`
- stage: `COMMITTED`
