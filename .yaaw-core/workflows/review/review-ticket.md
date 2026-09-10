# Review ticket

## Purpose
Independently determine whether current implementation satisfies the current ticket contract.

## Inputs
Exact handoff; exactly one ticket in `REVIEW_REQUIRED`; exact current ticket/spec/product/engineering-decision/rule revisions; immutable implementation evidence and prior review rounds listed by handoff; selected expertise; and actual repository state/diff for the admitted scope. Learned memory may be consulted only after the primary evidence review when the Reviewer `context_policy` permits it.

## Preconditions
Handoff names exactly one ticket in `REVIEW_REQUIRED` plus exact current source revisions and evidence.

## Procedure
1. Use a fresh review context when practical.
2. Read only the exact workflow artifacts/evidence/prior reviews listed by handoff plus actual repository state for the admitted scope.
3. Execute `review.inspect-change` under the same handoff without using project memory for the primary inspection.
4. Check every acceptance criterion and required test/evidence.
5. Inspect regressions, failure paths, security, UX/accessibility, migration, and compatibility when relevant.
6. Only after steps 3-5, if historical context could materially improve inspection and the handoff context policy permits it, search learned project memory for recurring regressions, previous review findings, historical problem patterns, subsystem conventions, known failure modes, or rationale. Verify any material remembered claim against current authority/reality. Memory may explain or suggest an inspection lead but is never acceptance evidence and cannot manufacture `PASS`.
7. Execute `review.classify-findings` under the same handoff.
8. Execute `review.record-review` under the same handoff to write the next immutable canonical review path.
9. Return the classification to Orchestrator; do not mutate ticket lifecycle or dispatch the next role.

## Output
Exactly one result: `PASS`, `REPAIR`, `REPLAN`, or `BLOCKED`.
