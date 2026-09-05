# PRD question round

## Purpose
Resolve only the material product unknowns visible at the current frontier.

## Inputs
Current `product.md` and unresolved product questions.

## Procedure
1. Ask at most 10 meaningful questions about users, problems, behavior, flows, constraints, scope, or non-goals.
2. Use A/B/C options, recommendation, and short reason when useful; never generate filler.
3. Treat free-form answers as first-class and do not force the offered options.
4. Do not ask implementation questions unless the human explicitly made implementation a product constraint.

## Output
A bounded question round awaiting human answers. Do not mutate accepted decisions before answers arrive.
