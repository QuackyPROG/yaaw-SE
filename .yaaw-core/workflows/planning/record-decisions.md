# Record engineering decisions

## Purpose
Convert accepted engineering answers into durable, independently resumable decisions.

## Inputs
Current engineering artifact, latest accepted engineering answers, current product authority, repository evidence, resolved research referenced by the frontier, and `.yaaw-core/rules/assumption-challenge.md`.

## Procedure
1. Validate the accepted answer against current repository facts and role authority.
2. If the answer changes or supplies missing product meaning, return `PRODUCT_GAP` to PRD/human authority.
3. If it conflicts with an accepted `ENG-*` decision, supersede that decision explicitly and execute invalidation/replan semantics.
4. Otherwise create/update `ENG-NNN` entries with Status, Decision, Reason, material rejected alternatives, implications, and product/repository/research provenance.
5. Increment engineering revision for material contract changes.
6. Record durable conclusions rather than the challenge/question transcript.
7. Mark the current frontier/readiness stale and return to `planning.route`; `planning.decision-frontier` must recompute the canonical frontier before another question round or readiness check.

## Output
Updated `engineering.md` with stable decision IDs/provenance and a stale frontier requiring recomputation.
