# Record engineering decisions

## Purpose
Convert accepted engineering answers into durable, independently resumable decisions.

## Inputs
Current engineering artifact and latest accepted engineering answers.

## Procedure
1. Create/update `ENG-NNN` entries with Status, Decision, Reason, material rejected alternatives, implications, and product/repository provenance.
2. Increment engineering revision for material contract changes.
3. Update unresolved questions, assumptions, risks, current frontier, future fog, and architecture spine.
4. If an existing accepted decision/spec/ticket is superseded, execute invalidation propagation.
5. Record before another question round.

## Output
Updated `engineering.md` with stable decision IDs and provenance.
