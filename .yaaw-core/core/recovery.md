# Recovery policy

Recovery compares claimed state with observed reality and returns to the last trustworthy boundary.

## Evidence authority
- Product intent: current accepted product revision.
- Engineering meaning: current engineering decisions, spec revision, and ticket revision.
- Implementation reality: current workspace plus canonical repository identity.
- Acceptance: Reviewer-owned evidence bound to exact source revisions and repository identity.
- state.json and runtime handoff: replaceable routing caches, never stronger than durable evidence.

## PASS recovery
When ticket state is `PASS`:
1. If current source revisions differ from the accepted source basis, record a contract-stale cause and reconcile `PASS -> REPLAN_REQUIRED`.
2. Else if review is missing, reconcile `PASS -> REVIEW_REQUIRED` with `REVIEW_MISSING`.
3. Else if legacy repository identity cannot be reproduced, reconcile `PASS -> REVIEW_REQUIRED` with `LEGACY_IDENTITY_UNVERIFIABLE`.
4. Else if review repository basis differs, reconcile `PASS -> REVIEW_REQUIRED` with `REVIEW_REPOSITORY_STALE`.
5. Else if required verification is missing or repository-stale, reconcile `PASS -> REVIEW_REQUIRED`.
6. Otherwise keep `PASS`.

Never route a source-current PASS to Planner solely because repository identity changed.

`IN_PROGRESS` plus implementation plus verification plus no current review reconciles to `REVIEW_REQUIRED`. `READY` plus existing implementation is recovered rather than reimplemented.

A stale runtime handoff is discarded and regenerated. If repository identity is required but cannot be produced, return `PRECONDITION_UNSATISFIED:REPOSITORY_IDENTITY_UNAVAILABLE` or `BLOCKED` with the missing proof.
