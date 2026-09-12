# Record engineering decisions

## Purpose
Convert accepted engineering answers into durable, independently resumable decisions.

## Inputs
Current engineering artifact, latest accepted engineering answers, current product authority, repository evidence, and `.yaaw-core/rules/assumption-challenge.md`.

## Procedure
1. Validate the accepted answer against current repository facts and role authority before recording it.
2. If the answer changes or supplies missing product meaning, return `PRODUCT_GAP` to PRD/human authority rather than encoding it as engineering truth.
3. If it conflicts with an accepted `ENG-*` decision, supersede that decision explicitly and execute invalidation/replan semantics; never silently overwrite history.
4. Otherwise create/update `ENG-NNN` entries with Status, Decision, Reason, material rejected alternatives, implications, and product/repository provenance.
5. Increment engineering revision for material contract changes.
6. Reapply the assumption-challenge rule to recompute assumptions, risks, unresolved questions, current frontier, future fog, and architecture spine.
7. Record durable conclusions rather than the challenge/question transcript.
8. Only after recording and recomputation may another question round begin.

## Output
Updated `engineering.md` with stable decision IDs, provenance, and recomputed assumptions/frontier/fog.
