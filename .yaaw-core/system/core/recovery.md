# Recovery contract

Recovery reconstructs the last trustworthy durable boundary; conversation loss is never permission to repeat semantic work.

- Accepted current spec not reflected in state -> adopt exactly that spec; multiple candidates block.
- Current ticket file absent from state -> register one ticket per reconciliation cycle.
- `READY` plus valid implementation-start evidence -> `IN_PROGRESS`.
- `IN_PROGRESS` plus current PASS verification -> `REVIEW_REQUIRED`.
- `IN_PROGRESS` plus start evidence but no PASS verification -> `implementation.verify-ticket`.
- `REVIEW_REQUIRED` plus a valid current immutable review -> adopt its result before another Reviewer dispatch.
- Source drift -> use routing-policy invalidation, normally `REPLAN_REQUIRED`.
- Source-current acceptance/repository drift -> `REVIEW_REQUIRED`.
- Missing proof -> exact `BLOCKED`, never guessing.

Each observation applies at most one legal reconciliation and increments transition provenance once.
