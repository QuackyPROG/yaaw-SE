---
name: qa-regression
description: Independently review the actual diff against accepted intent and risk, verify evidence and blast radius, and return PASS, REPAIR_REQUIRED or STOP_AND_REPLAN.
---

# QA Regression

## Artifact contract

Canonical machine contract: `.agents/artifacts.json` -> `contracts.skills.qa-regression`.

- Read: actual diff, originating contract, relevant PRD/spec/decision/map, preservation invariants, verification evidence, `.agents/ownership.json`, `.agents/artifacts.json`, affected canonical docs.
- Produce: `QA_REPORT`.
- Primary destination is the current DELIVERY ticket `#QA`; use only the registered overflow locator for large evidence and link it from the ticket.
- Never repair product code in the same QA context, alter accepted PRD intent, or manufacture a pass from missing evidence.

## Fixed point

Start from explicit base/head or equivalent actual diff. Do not review only an Implementer summary.

## Risk first

Spend review effort in proportion to consequence and failure likelihood. Prioritize state transitions involving authorization, money, secrets/privacy, destructive writes, migrations, concurrency, retries/idempotency, external side effects, compatibility, recovery, and irreversible behavior before low-risk polish.

Test counts and coverage percentages are supporting signals, not substitutes for risk coverage.

## Review axes

### Intent / contract
Verify accepted observable behavior, relevant PRD invariants, omissions, unintended extra behavior, scope and acceptance fidelity.

### Preservation
Verify every declared preservation invariant still holds. A fix that breaks a protected property is not acceptable merely because the new acceptance criterion passes.

### Standards
Verify correctness, edge/error handling, lifecycle, interface quality, semantic duplication, maintainability, test quality, repository conventions and documentation consistency.

### Scope
Compare every changed path and meaningful behavioral side effect to allowed/forbidden rules **and expected change surface**. Unexplained drift blocks PASS. Plan-invalidating expansion is `STOP_AND_REPLAN`; bounded defects are `REPAIR_REQUIRED`.

### Evidence
Re-run or add focused checks when necessary. Distinguish `not run`, `failed`, `passed`, and `not applicable`. Classify material findings as `CONFIRMED`, `SUPPORTED`, `SUSPECTED`, or `UNKNOWN`; include reproduction, test, runtime, or static proof sufficient for the label.

Prefer real dependency/integration validation when mocks can reproduce only the implementation's own assumptions and the risk justifies the cost.

## Result

Return PASS, REPAIR_REQUIRED with prioritized evidence-backed findings, or STOP_AND_REPLAN with contradictory/stale-source evidence; checkpoint the registered QA_REPORT before downstream delivery.
