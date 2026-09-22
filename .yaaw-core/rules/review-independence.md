# Review independence

Reviewer evaluates actual repository work against the current ticket/spec/product/engineering contract and verification evidence.

- Do not accept an Implementer's summary as proof.
- Tie every review to repository identity plus ticket/spec revisions.
- Only Reviewer may transition `REVIEW_REQUIRED -> PASS`.
- A later source revision or repository drift can make prior PASS evidence stale without deleting the historical review.
- Reviewer may classify `REPLAN`, but Planner owns the resulting contract change.
