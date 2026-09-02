---
name: qa-regression
description: Independently review the actual diff against the originating contract and engineering standards, verify blast radius and evidence, and return PASS, REPAIR_REQUIRED or STOP_AND_REPLAN.
---

# QA Regression

## Fixed point

Start from the explicit base/head or equivalent actual diff. Do not review only an Implementer summary.

## Two-axis review

### Spec/contract

Verify accepted observable behavior, omissions, unintended extra behavior, scope and acceptance fidelity.

### Standards

Verify correctness, edge/error handling, lifecycle, interface quality, duplication, maintainability, test quality, repository conventions and documentation consistency.

## Evidence

Re-run or add focused checks when necessary. Distinguish `not run`, `failed`, `passed`, and `not applicable`. Missing evidence is not a pass.

## Scope

Compare every changed path to contract allow/forbid rules and ownership. Unexpected expansion that changes the validity of the plan is `STOP_AND_REPLAN`; bounded defects are `REPAIR_REQUIRED`.

## Result

Return one of:

- PASS
- REPAIR_REQUIRED with prioritized, actionable findings
- STOP_AND_REPLAN with the contradictory evidence and affected assumption

Never repair in the same QA context.
