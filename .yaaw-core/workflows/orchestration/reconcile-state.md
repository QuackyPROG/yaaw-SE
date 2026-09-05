# Reconcile state

Compare claims with evidence and repair only evidence-backed inconsistencies.

Examples:
- `IN_PROGRESS` + expected implementation + passing evidence + no review -> `REVIEW_REQUIRED`.
- `PASS` + missing implementation or missing/stale review -> inconsistency; never retain PASS blindly.
- `READY` + implementation already present -> avoid duplicate implementation and inspect/review the work.

If the last trustworthy boundary cannot be proven, return `BLOCKED` rather than guessing.
