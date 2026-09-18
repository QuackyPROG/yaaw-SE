# Planning readiness review

## Purpose
Use a fresh Planner review to decide whether the current frontier is implementable and verifiable without invention.

## Inputs
Exact current product/engineering revisions, target frontier ID, all current-frontier RSH/ENG references, repository evidence, relevant rules/spec context, and selected expertise.

## Readiness questions
A PASS requires affirmative evidence that:
- a fresh Implementer can execute without inventing product or architecture decisions;
- all current-frontier external facts are resolved;
- material assumptions are verified or explicitly accepted;
- important terms, states, failure transitions, migration/compatibility/rollback requirements, and dependencies are precise when material;
- an appropriate test seam exists;
- the oracle is independent;
- the verification mode fits the work and the expected behavior is actually falsifiable/observable;
- Planner did not convert a product gap into an engineering decision;
- Planner did not pre-plan Future Fog as fake precision.

## Results
- `PASS`: frontier executable;
- `MISSING_DECISIONS`: Planner must resolve engineering questions;
- `PRODUCT_GAP`: return to PRD/human authority through Orchestrator;
- `REPLAN`: accepted planning conflicts with later evidence;
- `BLOCKED`: required evidence unavailable.

Research must already be resolved before readiness can PASS; there is no special readiness RESEARCH result.

## Mutations
Record the result, frontier ID, source revisions, reason, and evidence in Planner-owned engineering state and return it to Orchestrator. A PASS becomes stale when its product/engineering/research basis changes.
