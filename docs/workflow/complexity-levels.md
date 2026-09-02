# Complexity Levels

Complexity is a routing decision, not a prestige score. Choose the lowest level that safely contains uncertainty, blast radius, and decision load.

## L0 — Micro

Use when all are true: owner is known, change is tiny/local/reversible, acceptance is obvious, no architecture/trust/provider/dependency decision is involved, and targeted verification is available.

Route: `Orchestrator -> ephemeral micro-contract -> same-context change -> scope check -> targeted verification`.

Promotion triggers include unexpected files, unclear acceptance, failing unrelated assumptions, or a new owner/boundary.

## L1 — Bounded

One known-owner bug or feature that fits one fresh implementation context. Planner is not required when the desired outcome and boundaries are already clear.

Route: `Orchestrator -> bounded contract/ticket -> fresh Implementer -> targeted verification -> optional QA by risk`.

## L2 — Planned Feature

Use when work needs decomposition, has multiple slices/decisions, touches shared code, materially changes interfaces, or needs a durable spec.

Route: `Planner -> spec/decisions -> ticket graph -> frontier -> fresh Implementer(s) sequentially or isolated -> fresh QA`.

## L3 — Initiative

Use when destination is known but significant details depend on discovery or sequential decisions. Maintain an initiative map with current decisions, precise frontier tickets, and fog/not-yet-specified work.

Route: `Planner + Discovery/Decision work -> rolling graph -> delivery frontier -> PLAN_DELTA as evidence changes future -> fresh QA`.

## L4 — Program / Architecture

Use for major architecture, repository/platform migration, security/trust boundaries, cross-cutting provider changes, broad destructive/reversible-risk work, or work exceeding one coherent initiative context.

Route: progressive wayfinding, ADR/migration design, explicit rollback/compatibility strategy, bounded delivery graphs, isolated work when necessary, repeated independent QA/integration gates.

## Promotion

Promotion is monotonic for the current risk episode: a task may become more rigorous when evidence expands scope. It may only return to a cheaper route after the higher-level question is resolved and a newly bounded contract is created.

Do not ask a human merely because the level increased. Investigate first; ask when the missing information is genuinely a product preference, approval, inaccessible observation, or external authority.
