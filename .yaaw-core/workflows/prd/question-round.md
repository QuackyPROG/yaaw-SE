# PRD question round

## Purpose
Resolve only the material product unknowns visible at the current frontier.

## Inputs
Current `product.md`, unresolved product questions, `.yaaw-core/rules/assumption-challenge.md`, and `.yaaw-core/rules/question-format.md`.

## Procedure
1. Apply the assumption-challenge rule to accepted product truth and the unresolved product frontier.
2. Detect material contradictions, ambiguous terminology, unsupported product assumptions, premature abstractions, and important scenario/failure/edge gaps.
3. Exclude questions whose prerequisites remain unresolved.
4. Exclude engineering-only questions unless the human explicitly made implementation a product constraint.
5. Rank only material current-frontier product questions; prefer fewer high-leverage questions over a full batch.
6. Format at most 10 questions using `question-format.md`; use options, recommendation, and a short reason when useful.
7. Treat free-form answers as first-class and never force the offered options.
8. Stop for human answers.

## Output
A bounded question round awaiting human answers. Do not mutate accepted decisions before answers arrive.
