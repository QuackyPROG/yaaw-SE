# Record PRD decisions

## Purpose
Turn human answers into durable product truth before conversation continues.

## Inputs
Current product artifact and the latest human answers.

## Procedure
1. Interpret only what the answers support.
2. Update the relevant product sections and accepted product decisions.
3. Remove settled questions and add newly discovered unresolved questions.
4. Preserve explicit corrections and non-goals.
5. If accepted product meaning changed, increment product `revision` and record provenance.
6. If downstream planning/spec/ticket artifacts already depend on the changed intent, execute the invalidation policy in `core/invalidation.md`.
7. Only after the write completes may another question round begin.

## Output
Updated `product.md`, product revision/status, and any invalidation result.
