# Preserve historical acceptance across later YAAW work

## Reported failure

A reviewed foundation ticket reached `PASS` under engineering revision 7. The next Planner refreshed engineering understanding to revision 8, which made the previous ticket/spec source revisions noncurrent. The old router changed `PASS -> REPLAN_REQUIRED`, then Planner could not legally restore the completed ticket to PASS. Independently, the old router compared a completed ticket's review snapshot against the *current* repository identity; ordinary follow-on work would reopen earlier PASS tickets.

## Correct distinction

- **Current executable contract:** `READY`, `IN_PROGRESS`, `REVIEW_REQUIRED`, and `REPAIR_REQUIRED` require current source revisions; stale source still causes `REPLAN_REQUIRED`.
- **Historical completion:** `PASS` records the result of an independent review of a particular ticket/spec revision and repository snapshot. It is not an approval of new scope, new source revisions, or later changed code. If review and PASS verification refer to the same original repository snapshot and exact ticket/spec revisions, later engineering or repository changes do not revoke it.
- **Future work:** A new product/engineering frontier receives a fresh spec and tickets. Any revised behavior needs fresh verification and independent review. Historical PASS is not admitted as an executable current ticket merely because the old status remains PASS.
- **Legacy correction:** An already-demoted `REPLAN_REQUIRED` ticket may return to historical PASS automatically only if its source is stale and its latest immutable PASS review and PASS verification still agree on ticket/spec revisions, evidence ID, and reviewed repository identity. This is restoration of a past outcome, **not** a new review. The lifecycle kernel explicitly authorizes only this evidence-backed reconciliation.
- **Fail closed:** No missing review, invalid verification, conflicting repository snapshots, changed ticket/spec revision, or current `REPLAN_REQUIRED` contract can use the restoration. An unverifiable stale PASS produces a blocker rather than inventing acceptance.

## Required reported-case continuation

```text
TASK-001 PASS, reviewed at engineering r7
  -> Planner records new engineering r8
  -> TASK-001 remains historical PASS
  -> current accepted spec is absent; planning.route determines next frontier

TASK-001 REPLAN_REQUIRED, already demoted by old runtime
  + unchanged original ticket/spec revisions
  + matching historical PASS verification and independent PASS review
  + stale source metadata
  -> HISTORICAL_PASS_RESTORED
  -> orchestrator --reconcile-one updates only ticket status to PASS
  -> planning.route continues
```

Do not hand-edit managed `.yaaw-core/system/**` inside a consumer. Merge, test, version and publish the source repair first; then use the supported installer to update the consumer installation without replacing `.yaaw-core/project/**`. From the consumer workspace inspect the proposed reconciliation before applying it:

```powershell
node .yaaw-core/system/engine/runtime.mjs --workspace . --inspect-only
node .yaaw-core/system/engine/runtime.mjs --workspace .
# Expect: RECONCILE_REQUIRED, id HISTORICAL_PASS_RESTORED, from REPLAN_REQUIRED, to PASS.
node .yaaw-core/system/engine/runtime.mjs --workspace . --reconcile-one
node .yaaw-core/system/engine/runtime.mjs --workspace .
# Expect: PASS preserved and planning.route or another genuine next workflow.
```

The actual `TASK-001` fixture was not available in the source repository and this procedure must not be described as executed against the consumer's local Windows worktree. Regression coverage includes focused router cases plus an end-to-end runtime fixture that recreates the old demotion and recovers it.

## Boundaries

This does not change Reviewer authority, infer project completion, waive unfinished-ticket freshness, edit original review/evidence records, or declare new product scope implemented. Later code changes can invalidate a *new* contract's readiness, but they do not retroactively erase a historically valid independent review.
