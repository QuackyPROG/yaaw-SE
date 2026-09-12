# Engineering question round

## Purpose
Resolve material engineering decisions at the current frontier without forcing fake precision into future fog.

## Inputs
Current product/engineering revisions, repository observations/evidence relevant to the current frontier, `.yaaw-core/rules/assumption-challenge.md`, and `.yaaw-core/rules/question-format.md`.

## Procedure
1. Load only the current decision frontier plus the accepted product/engineering revisions and evidence needed to reason about it.
2. Apply the assumption-challenge rule to detect contradictions, unsupported engineering assumptions, premature architecture, and material scenario/failure/data/security/migration/testing/operability gaps.
3. Eliminate questions answerable from repository facts.
4. Eliminate routine reversible implementation decisions the Planner owns.
5. Eliminate questions whose prerequisites are unresolved or that belong in future fog.
6. If a question is actually a missing product decision, return it to PRD/human authority rather than inventing product intent.
7. Do not reopen settled `ENG-*` decisions without new evidence, contradiction, changed upstream intent, or explicit request.
8. Ask only currently answerable material engineering questions; prefer fewer high-leverage questions over a full batch.
9. Format at most 10 using `question-format.md`; include recommendation plus a short reason when analysis supports one and accept free-form alternatives.
10. Stop for human input.

## Output
A bounded current-frontier question round awaiting human answers.
