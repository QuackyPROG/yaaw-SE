---
name: qa-regression
description: Independently review the actual diff against the originating contract and engineering standards, verify blast radius and evidence, and return PASS, REPAIR_REQUIRED or STOP_AND_REPLAN.
---

# QA Regression

## Artifact contract

Canonical machine contract: `.agents/artifacts.json` -> `contracts.skills.qa-regression`.

- Read: actual diff, originating contract, verification evidence, `.agents/ownership.json`, `.agents/artifacts.json`, affected canonical docs.
- Produce: `QA_REPORT`.
- Primary destination is the current DELIVERY ticket `#QA`; use only the registered overflow locator for large evidence and link it from the ticket.
- Never repair product code in the same QA context or manufacture a pass from missing evidence.

## Fixed point

Start from explicit base/head or equivalent actual diff. Do not review only an Implementer summary.

## Two-axis review

### Spec/contract
Verify accepted observable behavior, omissions, unintended extra behavior, scope and acceptance fidelity.

### Standards
Verify correctness, edge/error handling, lifecycle, interface quality, duplication, maintainability, test quality, repository conventions and documentation consistency.

## Evidence

Re-run or add focused checks when necessary. Distinguish `not run`, `failed`, `passed`, and `not applicable`.

## Scope

Compare every changed path to contract allow/forbid rules and ownership. Plan-invalidating expansion is `STOP_AND_REPLAN`; bounded defects are `REPAIR_REQUIRED`.

## Result

Return PASS, REPAIR_REQUIRED with prioritized findings, or STOP_AND_REPLAN with contradictory evidence; checkpoint the registered QA_REPORT before downstream delivery.
