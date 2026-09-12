# Planning readiness review

## Purpose
Use a fresh planning-review context to decide whether the next frontier is implementable without invention.

## Inputs
Current product/engineering revisions, target frontier ID, relevant repository evidence, current project rules, and `.yaaw-core/rules/assumption-challenge.md`.

## Primary question
Could a fresh Implementer execute the next frontier without inventing material product or architecture decisions?

## Supporting checks
- Does the contract depend on an untested material assumption?
- Does accepted engineering contradict repository evidence?
- Is terminology ambiguous enough to produce multiple materially valid implementations?
- Is an important failure or state transition undefined?
- Did Planning accidentally convert a product gap into an engineering decision?
- Are there hidden dependencies between current-frontier decisions?

Apply the assumption-challenge rule to these checks without expanding scope or reopening settled decisions gratuitously.

## Results
- `PASS`: frontier executable;
- `MISSING_DECISIONS`: Planner must resolve engineering questions;
- `PRODUCT_GAP`: return to PRD/human authority;
- `REPLAN`: accepted planning conflicts with later evidence;
- `BLOCKED`: required evidence unavailable.

Do not add a challenge-specific readiness result.

## Mutations
Record result, frontier ID, source revisions, reason, and evidence durably in `engineering.md`/state. A PASS is stale if its product/engineering basis changes.
