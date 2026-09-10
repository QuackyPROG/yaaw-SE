# Review independence

Reviewer evaluates actual repository work against the current ticket/spec/product/engineering contract and verification evidence.

- Do not accept an Implementer's summary as proof.
- Tie every review to repository identity plus ticket/spec revisions.
- Only Reviewer may establish the semantic `PASS` acceptance judgment for `REVIEW_REQUIRED`; Orchestrator validates that immutable review and persists the `REVIEW_REQUIRED -> PASS` lifecycle transition.
- Reviewer never writes ticket lifecycle metadata or `.yaaw/state.json`.
- A later source revision or repository drift can make prior PASS evidence stale without deleting the historical review.
- Reviewer may classify `REPLAN`, but Planner owns the resulting contract change and Orchestrator owns lifecycle persistence.
