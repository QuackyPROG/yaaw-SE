# Plan Delta Protocol

A `PLAN_DELTA` is the controlled mechanism for adapting an active plan after new evidence appears.

## Trigger

An Implementer, Discovery agent, QA agent, or Orchestrator may request replanning when new information materially affects ownership, acceptance, dependency ordering, architecture, risk, feasibility, or ticket size.

Only the Planner may author the graph-changing delta. Human approval is still required when the underlying decision belongs to the human/product authority.

## Required input

- current initiative/spec/ticket identity;
- exact new evidence;
- which previous assumption is contradicted or incomplete;
- actual diff/current implementation state if work already began;
- whether any completed work may be affected;
- urgency/blocking impact.

## Allowed delta actions

1. `CONTINUE` — evidence does not materially change the contract.
2. `AMEND_UNRESOLVED` — refine unresolved detail without changing fundamental outcome/owner.
3. `SPLIT` — replace one unresolved ticket with smaller tickets.
4. `INSERT_PREREQUISITE` — add new work that blocks current/future work.
5. `ADD_FOLLOWUP` — current ticket can finish; newly discovered work follows.
6. `ADD_DISCOVERY` — evidence is insufficient; add a discovery blocker.
7. `ADD_DECISION` — multiple valid directions require a decision blocker.
8. `RESEQUENCE` — change blocker relationships among unresolved tickets.
9. `PROMOTE_LEVEL` — increase planning/QA/isolation rigor.
10. `SUPERSEDE_UNRESOLVED` — close/cancel future tickets made obsolete and replace them.
11. `CORRECT_COMPLETED_WORK` — create a new corrective/reversal ticket; never mutate historical completion.

## Invariants

- No silent scope expansion.
- Completed historical artifacts are not rewritten for cosmetic consistency.
- A delta must state why the old plan was valid given prior evidence and why the new evidence changes it.
- New tickets inherit current source-of-truth references rather than copied thread history.
- Blockers are rewired explicitly.
- Any material acceptance/architecture/trust decision is recorded durably before dependent implementation resumes.

## Minimal record

```markdown
## PLAN_DELTA

**Trigger:** <evidence>
**Affected:** <tickets/spec/map>
**Prior assumption:** <what changed>
**Decision:** <delta action>
**Graph changes:** <create/close/block/unblock/resequence>
**Completed work impact:** <none | corrective ticket required>
**New verification/QA:** <requirements>
```
