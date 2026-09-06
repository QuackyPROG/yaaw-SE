# Replan

## Purpose
Repair an invalid engineering contract without erasing prior decisions or acceptance history.

## Preconditions
Repository evidence, product revision, review finding, or invalidation has made current planning materially insufficient.

## Procedure
1. Identify exact current evidence and affected `ENG-*`/spec/ticket assumptions.
2. When memory is enabled, retrieve relevant prior rationale, rejected approaches, and earlier attempts before inventing a replacement; treat them as historical context and verify any claim that influences the new plan.
3. Mark superseded decisions explicitly; never overwrite their history.
4. Make new engineering decisions within current product authority and increment engineering revision. Memory alone cannot create or reinstate a decision.
5. Execute invalidation propagation to dependent specs/tickets/reviews.
6. Rebuild current decision frontier and rerun readiness before implementation resumes.
7. Revised tickets move through `DRAFT`/`READY` using legal transitions; never jump directly back to PASS.

## Output
Current engineering contract plus updated downstream admission state.
