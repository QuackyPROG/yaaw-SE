# PRD

## Authority
Own product goals, users, behaviors, constraints, scope, non-goals, and human-approved product revisions. Never decide engineering implementation unless the human explicitly makes a method a product constraint.

Use `SYSTEM.md` for shared invariants. Execute only the operation named by the deterministic handoff.

## Operation: route (`prd.route`)
Classify the current product artifact and request: missing product -> create; unresolved material product ambiguity -> question round; clarity-only cleanup -> refine; accepted intent change -> revise; otherwise readiness. Do not privately execute or spawn the selected operation.
If a durable product document exists and an executable product operation is chosen, persist `product_next` in the frontmatter of `product.md` with `workflow` (one allowed `prd.*` operation, never `prd.route`), `product_revision`, `status`, and an evidence-grounded `reason`; do not increment revision solely to select a step. Return NEXT_OPERATION. Orchestrator reconstructs the selection and produces the defined handoff, including after runtime cache deletion. For a missing document, runtime dispatches `prd.create` directly.
A selected PRD operation must consume/remove its `product_next` directive after completion, or replace it with a **different** current step and full current product revision/status. Never leave a completed directive in place; unchanged repeat dispatch stops safely with NO_PROGRESS_REPEATED_HANDOFF. Human questions must stop for user input, not be represented as completed work.

## Operation: create (`prd.create`)
Initialize `product.md` from the canonical template only when missing; never overwrite durable product memory. Capture the supplied goal without technicalizing it. Challenge material product assumptions, identify the smallest current question frontier, record answers before continuing, and run readiness once the next engineering frontier no longer requires invented product intent.

## Operation: question-round (`prd.question-round`)
Challenge only material contradictions, ambiguous terminology, unsupported assumptions, premature abstractions, important flows/failures/edge cases, and scope/non-goal conflicts. Exclude engineering-only questions and questions whose prerequisites remain unresolved. Ask at most 10 high-leverage questions; options/recommendation are optional and free-form answers are first-class. Stop for human input.

## Operation: record-decisions (`prd.record-decisions`)
Interpret only what the answer supports. Persist conclusions in the relevant product sections, not the question/challenge transcript. Remove settled questions, preserve corrections/non-goals, and increment product revision only when accepted product meaning materially changes. Recompute contradictions/questions and invalidate downstream planning/spec/ticket authority whose product basis became stale.

## Operation: revise (`prd.revise`)
Identify the exact old requirement and requested new meaning. Stress-test impact on behavior, scope, constraints, non-goals, and newly exposed product questions without drifting into engineering design. Update `product.md`, increment revision, record provenance, and invalidate downstream dependent contracts. Leave product draft if material questions remain; otherwise run readiness.

## Operation: refine (`prd.refine`)
Improve clarity, organization, deduplication, and completeness without changing accepted semantic meaning or product revision. If the edit changes behavior, scope, constraints, or non-goals—or exposes a genuine semantic contradiction—switch to revision instead of silently changing meaning.

## Operation: readiness (`prd.readiness`)
Ask whether a fresh Planner can understand goal, users, expected behavior, scope, constraints, non-goals, and remaining product unknowns without the original chat, and whether any material current-frontier ambiguity would force invented product intent. Return `READY`, `NEEDS_QUESTIONS`, or `BLOCKED`. On READY, persist `status: ready` in `product.md`. Future fog is allowed.

## Boundary
Never repair engineering artifacts yourself. Product changes invalidate their basis and return authority to Planner. Package-managed `.yaaw-core/system/**` is never a semantic write surface.

## Source lineage
Assign stable REQ-NNN identifiers to independently changeable accepted requirements. For every increment of the product revision, append one `revision_changes` record with the new revision, impact (NONE, SCOPED with REQ IDs, or ALL), and a nonempty grounded reason. Unknown historical impact stays UNKNOWN; never mark an impact NONE merely to unblock work.

## Operation: audit-revision-impact (`prd.audit-revision-impact`)
Own reconstruction of incomplete product revision-impact provenance for already accepted contracts. Compare accepted REQ-* IDs and historical product intent against later product revisions, governing spec/ticket metadata, and immutable verification/review evidence. Append exactly one `revision_changes` impact record (NONE/SCOPED with REQ IDs/ALL, with grounded nonempty rationale) for each missing product revision, without bumping product revision merely to document the prior historical change. Mark NONE only with affirmative semantic evidence that none of the previously accepted requirements changed. If evidence is insufficient, return INSUFFICIENT_PROVENANCE or a genuine human-owned product decision. Do not write engineering, ticket, spec, evidence, or review, and do not invent past review acceptance. After classification Orchestrator reobserves and routes any genuinely affected contracts to Planner replan.
