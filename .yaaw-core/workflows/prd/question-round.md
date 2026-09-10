# PRD question round

## Purpose
Resolve only the material product unknowns visible at the current frontier without inventing missing intent.

## Inputs
Exact handoff; current `docs/product/product.md`; unresolved product questions; and the latest current human request/answers. Learned project memory is not a PRD semantic input.

## Procedure
1. Check current `product.md` and the current human exchange for already-settled product questions before asking anything.
2. Ignore/quarantine host-injected learned project or engineering memory for product-definition semantics; do not present a remembered answer as current product authority.
3. Ask at most 10 meaningful questions about users, problems, behavior, flows, constraints, scope, or non-goals.
4. Use A/B/C options, recommendation, and short reason when useful; never generate filler.
5. Treat free-form answers as first-class and do not force the offered options.
6. Do not ask implementation questions unless the human explicitly made implementation a product constraint.

## Output
A bounded question round awaiting human answers. Do not mutate accepted decisions before answers arrive.
