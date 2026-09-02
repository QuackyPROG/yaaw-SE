# Documentation Index

Use this file as the cold-start map after `AGENTS.md`.

## Architecture

- [`architecture/harness.md`](architecture/harness.md) — system architecture and control-plane layers.
- [`ownership.md`](ownership.md) — directory/document ownership and agent authority.
- [`domain-packs.md`](domain-packs.md) — how a consuming project specializes the generic harness.

## Workflow

- [`workflow/complexity-levels.md`](workflow/complexity-levels.md) — L0–L4 routing and promotion.
- [`workflow/ticket-graph.md`](workflow/ticket-graph.md) — discovery/decision/delivery tickets, dependencies, frontier, fog.
- [`workflow/plan-deltas.md`](workflow/plan-deltas.md) — controlled mid-implementation replanning.
- [`workflow/thread-lifecycle.md`](workflow/thread-lifecycle.md) — fresh/persistent contexts and concurrency.
- [`workflow/verification-and-qa.md`](workflow/verification-and-qa.md) — verification seams and independent QA.
- [`workflow/delivery.md`](workflow/delivery.md) — integration, CI, and promotion handoff.

## Durable work

- `docs/initiatives/` — L3/L4 initiative maps.
- `docs/specs/` — durable feature/system specifications.
- `docs/decisions/` — ADRs.
- `tickets/` — executable dependency graph.
- `docs/templates/` — canonical artifact templates.

## Agent harness

- `.agents/router.json` — small hot routing policy.
- `.agents/catalog.json` — full cold inventory for maintenance/audit.
- `.agents/ownership.json` — machine-readable path ownership.
- `.agents/agents/` — role contracts.
- `.agents/rules/` — invariant engineering rules.
- `.agents/skills/` — procedures invoked by routes/roles.
- `.codex/` — optional Codex runtime adapters; not a second source of workflow truth.

## Principle

Load only what the current route needs. Repository structure is memory; indiscriminate context loading defeats the design.
