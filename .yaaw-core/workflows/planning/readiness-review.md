# Planning readiness review

## Purpose
Use a fresh planning-review context to decide whether the next bounded frontier is implementable without invention.

## Inputs
Current product/engineering revisions, target frontier ID, relevant repository evidence/capability, all research artifacts referenced as blocking by the frontier, current project rules, and `.yaaw-core/rules/assumption-challenge.md`.

## Primary question
Could a fresh Implementer execute the next frontier without inventing material product or architecture decisions?

## Supporting checks
- Is the frontier bounded and durably explicit?
- Does the contract depend on an untested material assumption?
- Is any blocking `RSH-*` still `PENDING`, `BLOCKED`, or stale?
- Does accepted engineering contradict repository evidence?
- Is terminology ambiguous enough to produce materially different implementations?
- Is an important failure or state transition undefined?
- Did Planning accidentally convert a product gap into an engineering decision?
- Are there hidden dependencies between current-frontier decisions?
- If the next route will create executable tickets, can trustworthy repository identity be obtained? If not, readiness cannot claim immediate implementation admission.

Apply the assumption-challenge rule without expanding scope or reopening settled decisions gratuitously.

## Results
- `PASS`: bounded frontier executable and no blocking research/product/engineering gap remains;
- `MISSING_DECISIONS`: Planner must resolve engineering questions;
- `PRODUCT_GAP`: return to PRD/human authority;
- `REPLAN`: accepted planning conflicts with later evidence;
- `BLOCKED`: required evidence/repository capability unavailable.

## Mutations
Record result, frontier ID, source revisions, reason, and evidence durably in `engineering.md`/state. A PASS is stale if its product/engineering/research basis changes.
