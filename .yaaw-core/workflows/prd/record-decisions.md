# Record PRD decisions

## Purpose
Turn current human answers into durable product truth before conversation continues.

## Inputs
Exact handoff, current product artifact, and the latest current human answers. Learned project memory is not an accepted product answer.

## Procedure
1. Interpret only what the current human answers and existing authoritative product artifact support.
2. Update the relevant product sections and accepted product decisions.
3. Remove settled questions and add newly discovered unresolved questions.
4. Preserve explicit corrections and non-goals.
5. If accepted product meaning changed, increment product `revision` and record provenance.
6. If the changed intent may invalidate downstream planning/spec/ticket acceptance, return the invalidation requirement to Orchestrator with the changed product revision and requirement/provenance; do not read or mutate Planner/Reviewer/Implementer-owned artifacts to perform the cascade yourself.
7. Only after the product write completes may another question round begin.

## Output
Updated `docs/product/product.md`, current product revision/status, and `SUCCESS` plus an `invalidation_required` flag/provenance when downstream trust must be reconsidered.
