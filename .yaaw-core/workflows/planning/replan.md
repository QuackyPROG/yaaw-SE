# Replan

## Purpose
Repair an invalid engineering contract without erasing prior decisions or acceptance history.

## Preconditions
Repository evidence, product revision, review finding, or invalidation has made current planning materially insufficient.

## Procedure
1. Identify exact evidence and affected `ENG-*`/spec/ticket assumptions.
2. Mark superseded decisions explicitly; never overwrite their history.
3. Make new engineering decisions within current product authority and increment engineering revision.
4. Execute invalidation propagation to dependent specs/tickets/reviews.
5. Rebuild current decision frontier and rerun readiness before implementation resumes.
6. Revised tickets move through `DRAFT`/`READY` using legal transitions; never jump directly back to PASS.

## Output
Current engineering contract plus updated downstream admission state.
