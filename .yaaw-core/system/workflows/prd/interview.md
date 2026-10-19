# PRD interview workflow for the host agent

This workflow is for **product discovery**, not code architecture. Read `AGENTS.md`, `SYSTEM.md`, then run the CLI with the consumer **workspace root**, not the YAAW framework repository root unless it is the actual target project.

## Turn protocol

1. `node bin/yaaw-prd.mjs status --workspace <root>`; if the product doesn't exist, `init` it. `context` gives accepted requirements and any active question/proposal frontier.
2. For a new round, choose the smallest important unanswered frontier among the eight sections. Create `batch.json` matching `examples/batch.json`, invoke `batch`. Ask the exact questions with short A/B/C choices, recommendation, and optional rationale. End turn for human answers. Never use the engine to generate questions; the agent generates them.
3. Interpret the user's numbered responses without assuming recommendations were selected. Put them in `answers.json` and call `answer`. A user can respond with A/B/C or arbitrary prose. Where a response is "skip", treat the uncertainty as unresolved; do not invent intent.
4. Write independently meaningful product statements as `proposals.json` and call `propose`. The CLI appends them to a **pending / not accepted** area in `product.md`.
5. Perform a semantic review **after staging**. Fresh reviewer context when available: read user answers, the relevant accepted requirements (including non-goals and related journeys), and staged proposals. Check conflicts with previous rounds, overreach, missing exceptions and scope drift. Emit `review.json` with the returned `reviewBasis`. `PASS` requires no findings and authorizations for any replacements. `CLARIFY` requires specific findings. Call `review` to promote or reject.
6. On `CLARIFY`, generate the smallest targeted next batch. On PASS, reconsider unanswered frontiers; do not ask repetitive questions. Trigger cross-section audit periodically (for example after three batches) and before final readiness.
7. Before marking READY, perform an independent product-readiness audit of all eight sections, explicitly declaring COVERED/NOT_APPLICABLE and the absence of material blockers. Call `finalize` with the audit; never mark READY solely because a template is filled.

## Semantics that require human judgment

A review basis hash only ensures the reviewer inspected the **same data** that was staged. It cannot establish true independence or semantic consistency. Review requires reasoning through changes to previously accepted product intent. If new answers imply contradictory user behavior, explicitly ask the human rather than merging conflicting statements. Never infer engineering details, even if some technical method would be convenient.

## Example question style

1. Who is the first audience for this product?
   A. Individual users
   B. Small teams
   C. Everyone
   Recommendation: A — narrower first audience usually makes product behavior easier to specify.

Ask fewer than 10 when fewer are genuinely needed. Question sections can differ within a batch when dependent decisions are already resolved. Do not read all historical raw answers unless reviewing a reported contradiction.
