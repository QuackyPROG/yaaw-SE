# Record PRD decisions

## Purpose
Turn current human answers into durable product truth before conversation continues.

## Inputs
Current product artifact and the latest human answers. Historical project-memory context may explain what was discussed before but is not an accepted answer by itself.

## Procedure
1. Interpret only what the current human answers and existing authoritative product artifact support.
2. Do not promote a remembered answer into product truth unless the human has currently confirmed it or it is already present in current `product.md`.
3. Update the relevant product sections and accepted product decisions.
4. Remove settled questions and add newly discovered unresolved questions.
5. Preserve explicit corrections and non-goals.
6. If accepted product meaning changed, increment product `revision` and record provenance.
7. If downstream planning/spec/ticket artifacts already depend on the changed intent, execute the invalidation policy in `core/invalidation.md`.
8. Only after the write completes may another question round begin.

## Output
Updated `product.md`, product revision/status, and any invalidation result.
