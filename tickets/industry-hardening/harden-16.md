---yaaw-json
{"schema":"yaaw.ticket/v1","id":"HARDEN-16","kind":"DELIVERY","status":"DONE","level":4,"parent":"INIT-INDUSTRY-HARDENING","owner":"orchestrator","blocked_by":["HARDEN-15"],"acceptance":["Integrate repository-native ownership/ruleset/CODEOWNERS signals, domain-pack installation/update semantics, external tracker/provider adapters, and cross-repository coordinated change-set contracts."],"qa":{"required":true,"profile":"HIGH_ASSURANCE"},"allowed_write":["scripts/yaaw/**",".agents/schemas/**","config/**","examples/**","tests/harness/**","docs/**"],"forbidden_write":["main promotion before final green CI"],"expected_change_surface":["scripts/yaaw/**",".agents/schemas/**","config/**","examples/**","tests/harness/**","docs/**"],"source_fingerprints":{"implementation_commit":"49ac567c0ce582a506ac8f757a9504792c1e6103","compatibility_correction":"16ba25f30088c5ea783d3f486fc589a09586525e","ci_run":"33846547696"},"risk":["agent-harness-control-plane"],"side_effects":["repository"]}
---
# HARDEN-16: Repository and multi-repo integration policy

## What to deliver

Integrate repository-native ownership/ruleset/CODEOWNERS signals, domain-pack installation/update semantics, external tracker/provider adapters, and cross-repository coordinated change-set contracts.

## Acceptance criteria

- [x] CODEOWNERS/ruleset evidence can inform but not silently override yaaw authority.
- [x] Domain packs have install/update/compatibility semantics.
- [x] Tracker/provider adapters preserve stable identity and observed-state rules.
- [x] Cross-repository work has explicit coordinated change-set/dependency/release contracts.

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
- `HARDEN-15` completed at `8a072812138d8e8b54fa130ef4d0787dd1a354fa`.

## Verification

- implementation commit `49ac567c0ce582a506ac8f757a9504792c1e6103`
- compatibility correction `16ba25f30088c5ea783d3f486fc589a09586525e`
- initial CI run `33846398824`: FAIL, exposing an unintended same-schema backward-compatibility break
- corrected GitHub Actions run `33846547696`: SUCCESS
- CODEOWNERS/ruleset evidence tests: PASS
- domain-pack lock/install/update/downgrade/compatibility tests: PASS
- legacy v1 compatibility regression: PASS
- tracker/provider stable-identity evidence-only tests: PASS
- cross-repository dependency/frontier/cycle/release-order tests: PASS
- full semantic/schema/runtime/state/policy/adversarial/scope gates: PASS

## QA disposition

`HIGH_ASSURANCE` satisfied by the corrected full CI run and explicit preservation of the failed compatibility attempt in history. Repository/provider inputs remain evidence-only by machine contract.

## Stop and replan triggers

- External API cannot provide required provenance/freshness/authority semantics.

## Implementation evidence

`49ac567c0ce582a506ac8f757a9504792c1e6103` adds repository evidence normalization, versioned domain-pack lifecycle, external observation contracts and cross-repository change sets. `16ba25f30088c5ea783d3f486fc589a09586525e` corrects the discovered v1 compatibility issue by treating omitted pack versions as legacy `0.0.0` rather than redefining an existing schema ID.

## QA result

PASS — corrected GitHub Actions run `33846547696` passed every gate. Residual risk: local CODEOWNERS parsing is intentionally a conservative fallback; host-resolved ownership/ruleset data should be preferred when available and remains evidence rather than semantic authority.

## Delivery

Integrated on `feat/industry-hardening` through `16ba25f30088c5ea783d3f486fc589a09586525e`; corrected CI green. `main` remains untouched pending `HARDEN-19`.
