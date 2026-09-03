---yaaw-json
{"schema":"yaaw.ticket/v1","id":"HARDEN-16","kind":"DELIVERY","status":"DRAFT","level":4,"parent":"INIT-INDUSTRY-HARDENING","owner":"orchestrator","blocked_by":["HARDEN-15"],"acceptance":["Integrate repository-native ownership/ruleset/CODEOWNERS signals, domain-pack installation/update semantics, external tracker/provider adapters, and cross-repository coordinated change-set contracts."],"qa":{"required":true,"profile":"HIGH_ASSURANCE"},"allowed_write":["scripts/yaaw/**",".agents/schemas/**","config/**","examples/**","tests/harness/**","docs/**"],"forbidden_write":["main promotion before final green CI"],"expected_change_surface":["scripts/yaaw/**",".agents/schemas/**","config/**","examples/**","tests/harness/**","docs/**"],"source_fingerprints":{},"risk":["agent-harness-control-plane"],"side_effects":["repository"]}
---
# HARDEN-16: Repository and multi-repo integration policy

## What to deliver

Integrate repository-native ownership/ruleset/CODEOWNERS signals, domain-pack installation/update semantics, external tracker/provider adapters, and cross-repository coordinated change-set contracts.

## Acceptance criteria

- [ ] CODEOWNERS/ruleset evidence can inform but not silently override yaaw authority.
- [ ] Domain packs have install/update/compatibility semantics.
- [ ] Tracker/provider adapters preserve stable identity and observed-state rules.
- [ ] Cross-repository work has explicit coordinated change-set/dependency/release contracts.

## Preservation invariants

- External systems are observed sources, not automatic semantic authority.

## Allowed write scope

- integration schemas/controller/examples/tests/docs.

## Forbidden write scope

- `main` promotion before final integration validation.

## Expected change surface

- repository/program integration surfaces.

## Canonical sources

- initiative map and ADR-001.

## Verification

- integration contract tests and adversarial fixtures.

## QA disposition

`INDEPENDENT_QA_REQUIRED` with `HIGH_ASSURANCE` profile.

## Stop and replan triggers

- External API cannot provide required provenance/freshness/authority semantics.

## Implementation evidence

Pending.

## QA result

Pending.

## Delivery

Pending.
