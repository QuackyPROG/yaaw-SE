# PRD question round

## Purpose
Resolve only the material product unknowns visible at the current frontier without making the human repeat useful historical context unnecessarily.

## Inputs
Current `product.md`, unresolved product questions, latest human request/answers, and optional historical leads retrieved under the PRD context policy.

## Procedure
1. Before asking, check current `product.md` and any permitted memory results for an earlier discussion of the same product question.
2. If memory suggests a prior answer that is not in the current product artifact, present it as historical context for confirmation/clarification rather than silently accepting it.
3. Ask at most 10 meaningful questions about users, problems, behavior, flows, constraints, scope, or non-goals.
4. Use A/B/C options, recommendation, and short reason when useful; never generate filler.
5. Treat free-form answers as first-class and do not force the offered options.
6. Do not ask implementation questions unless the human explicitly made implementation a product constraint.

## Output
A bounded question round awaiting human answers. Do not mutate accepted decisions before answers arrive.
