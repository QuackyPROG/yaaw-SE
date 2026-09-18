# Classify findings

## Purpose
Convert concrete observations from all three review lenses into one acceptance classification.

## Inputs
Contract-lens, test-validity-lens, and engineering-quality-lens observations; exact current contract; evidence; and repository identity.

## Finding contract
Each finding uses `F-NNN` and records: `lens`, severity, exact contract/source, expected, actual, evidence, and bounded action.

## Classification
- `PASS`: all required lenses support acceptance.
- `REPAIR`: ticket/spec are valid but implementation or test evidence is wrong/incomplete (including concrete bug, missing required negative test, tautological test, or missing failure handling).
- `REPLAN`: ticket/spec/seam/oracle/architecture contract is itself invalid or insufficient.
- `BLOCKED`: acceptance cannot be determined because required evidence/access is unavailable.

Style preference or heuristic smell alone cannot force failure. Do not choose REPAIR when satisfying the finding requires changing accepted product/architecture meaning.
