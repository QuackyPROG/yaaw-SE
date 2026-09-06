# Classify findings

## Purpose
Convert concrete review evidence into one authoritative outcome.

## Classification
- `PASS`: current contract satisfied with adequate evidence.
- `REPAIR`: implementation defect; ticket/spec remain valid. This includes bounded changeability defects supported by concrete engineering impact.
- `REPLAN`: ticket/spec/engineering contract is materially invalid or insufficient.
- `BLOCKED`: required evidence is unavailable.

## Findings
Assign durable `F-NNN` IDs and severity. Each finding records category, concrete evidence, expected behavior/property, actual behavior/implementation, and required repair/replan action.

For changeability findings, also record the violated principle and why the issue is more than a style preference. Valid categories include `CORRECTNESS`, `SECURITY`, `REGRESSION`, `CONTRACT`, `CHANGEABILITY`, `TESTING`, `COMPATIBILITY`, and `UX`.

Do not choose `REPAIR` when satisfying the finding requires changing accepted product/architecture meaning. Do not fail a review for personal style preference alone.
