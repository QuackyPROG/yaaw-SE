# Record PRD decisions

## Purpose
Turn human answers into durable product truth before conversation continues.

## Inputs
Current product artifact, latest human answers, and `.yaaw-core/rules/assumption-challenge.md`.

## Procedure
1. Interpret only what the answers support and validate the conclusion against PRD product authority.
2. Persist supported meaning in the relevant product sections and accepted product decisions; record conclusions rather than challenge/question transcripts.
3. Remove settled questions and check the accepted answer for impact on previous accepted product decisions, scope, constraints, behavior, and non-goals.
4. Preserve explicit corrections and non-goals; if a contradiction/correction changes accepted meaning, update product truth explicitly rather than silently merging both meanings.
5. Increment product `revision` and record provenance only when accepted product meaning materially changes.
6. If downstream planning/spec/ticket artifacts already depend on changed intent, execute the invalidation policy in `core/invalidation.md`.
7. Reapply the assumption-challenge rule to discover newly exposed questions and recompute the unresolved current product frontier.
8. Only after the durable write and frontier recomputation may another question round begin.

## Output
Updated `product.md`, product revision/status, recomputed unresolved product frontier, and any invalidation result.
