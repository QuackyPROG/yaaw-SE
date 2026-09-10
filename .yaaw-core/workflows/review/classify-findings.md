# Classify findings

## Purpose
Convert concrete review evidence into one authoritative acceptance classification.

## Inputs
Primary current review observations from `review.inspect-change`, the exact current ticket/spec/product/decision/rule contract, required test/evidence results, repository identity, and any secondary verified historical leads permitted by the Reviewer context policy.

## Classification
- `PASS`: current contract satisfied with adequate current evidence.
- `REPAIR`: implementation defect; ticket/spec remain valid.
- `REPLAN`: ticket/spec/engineering contract is materially invalid or insufficient.
- `BLOCKED`: required evidence is unavailable.

## Findings
Assign durable `F-NNN` IDs and severity. Each finding records concrete evidence, expected behavior, actual behavior, and required repair/replan action.

Do not choose `REPAIR` when satisfying the finding requires changing accepted product/architecture meaning. Learned memory is never sufficient evidence for any classification and can never establish `PASS`.
