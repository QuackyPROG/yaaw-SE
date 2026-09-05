# Planning readiness review

## Purpose
Use a fresh planning-review context to decide whether the next frontier is implementable without invention.

## Inputs
Current product/engineering revisions, target frontier ID, relevant repository evidence, and current project rules.

## Primary question
Could a fresh Implementer execute the next frontier without inventing material product or architecture decisions?

## Results
- `PASS`: frontier executable;
- `MISSING_DECISIONS`: Planner must resolve engineering questions;
- `PRODUCT_GAP`: return to PRD/human authority;
- `REPLAN`: accepted planning conflicts with later evidence;
- `BLOCKED`: required evidence unavailable.

## Mutations
Record result, frontier ID, source revisions, reason, and evidence durably in `engineering.md`/state. A PASS is stale if its product/engineering basis changes.
