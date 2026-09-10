# Planning readiness review

## Purpose
Use a fresh planning-review context to decide whether the next frontier is implementable without invention.

## Inputs
Exact handoff reads: current product and engineering revisions, target frontier ID, relevant current repository evidence, directly referenced engineering decisions/spec context, current project rules, and selected expertise when applicable.

## Primary question
Could a fresh Implementer execute the next frontier without inventing material product or architecture decisions?

## Results
- `PASS`: frontier executable;
- `MISSING_DECISIONS`: Planner must resolve engineering questions;
- `PRODUCT_GAP`: return to PRD/human authority through Orchestrator;
- `REPLAN`: accepted planning conflicts with later evidence;
- `BLOCKED`: required evidence unavailable.

## Mutations
Record the semantic readiness result, frontier ID, source revisions, reason, and evidence durably in Planner-owned `docs/engineering/engineering.md`. Return the result and source basis to Orchestrator for any runtime/state persistence. A PASS is stale if its product/engineering basis changes.
