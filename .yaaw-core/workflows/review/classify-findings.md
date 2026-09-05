# Classify findings

## Purpose
Convert concrete review evidence into one authoritative outcome.

## Classification
- `PASS`: current contract satisfied with adequate evidence.
- `REPAIR`: implementation defect; ticket/spec remain valid.
- `REPLAN`: ticket/spec/engineering contract is materially invalid or insufficient.
- `BLOCKED`: required evidence is unavailable.

## Findings
Assign durable `F-NNN` IDs and severity. Each finding records concrete evidence, expected behavior, actual behavior, and required repair/replan action.

Do not choose `REPAIR` when satisfying the finding requires changing accepted product/architecture meaning.
