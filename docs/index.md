# Documentation Index

Use this file as the cold-start map after `AGENTS.md`.

## Product intent

- [`workflow/product-intent.md`](workflow/product-intent.md) — observed truth vs intent truth, optional manual PRDs, and how PRDs feed progressive planning.
- `prd/` — optional human-authority Product Requirements Documents created/revised through the manual `prd-creation` skill.

## Architecture

- [`architecture/harness.md`](architecture/harness.md) — system architecture and control-plane layers.
- [`ownership.md`](ownership.md) — path ownership, artifact authority, and agent mutation boundaries.
- [`domain-packs.md`](domain-packs.md) — how a consuming project specializes the generic harness.

## Workflow

- [`workflow/overview.md`](workflow/overview.md) — end-to-end workflow diagram from intake/optional PRD through planning, execution, QA, commits, and release.
- [`workflow/controller.md`](workflow/controller.md) — deterministic admission, mutation, budgets, leases and failure behavior.
- [`workflow/runtime-gateway.md`](workflow/runtime-gateway.md) — executable dispatch/action admission boundary and its host-runtime containment limits.
- [`workflow/runtime-tracing.md`](workflow/runtime-tracing.md) — correlated gateway/action traces, redaction and diagnostic metrics.
- [`workflow/agent-evals.md`](workflow/agent-evals.md) — repeated agent-loop trials, separate outcome/trace grading and stochastic reliability metrics.
- [`workflow/empirical-evidence.md`](workflow/empirical-evidence.md) — pinned workload provenance, baseline/governed comparison and the UNPROVEN/EMPIRICAL claim boundary.
- [`workflow/security.md`](workflow/security.md) — instruction trust, command/side-effect policy, secrets and runtime boundaries.
- [`workflow/recovery.md`](workflow/recovery.md) — repository-first crash recovery, leases, idempotency and migration behavior.
- [`workflow/maturity.md`](workflow/maturity.md) — what is machine-enforced, agent judgment, runtime-dependent, and the current maturity claim.
- [`workflow/examples.md`](workflow/examples.md) — CI-executed L0–L4 and failure-path fixtures.
- [`workflow/complexity-levels.md`](workflow/complexity-levels.md) — L0–L4 routing and promotion.
- [`workflow/ticket-graph.md`](workflow/ticket-graph.md) — discovery/decision/delivery tickets, dependencies, frontier, fog.
- [`workflow/plan-deltas.md`](workflow/plan-deltas.md) — controlled mid-implementation replanning.
- [`workflow/artifact-contracts.md`](workflow/artifact-contracts.md) — deterministic artifact type/destination/authority resolution.
- [`workflow/thread-lifecycle.md`](workflow/thread-lifecycle.md) — fresh/persistent contexts and concurrency.
- [`workflow/verification-and-qa.md`](workflow/verification-and-qa.md) — verification seams and independent QA.
- [`workflow/delivery.md`](workflow/delivery.md) — integration, CI, and promotion handoff.
- [`workflow/quality-retrieval-lifecycle.md`](workflow/quality-retrieval-lifecycle.md) — stable QA identities, retrieval hooks, artifact lifecycle and diagnostic metrics.

## Durable work

- `docs/prd/` — optional accepted/draft product intent.
- `docs/initiatives/` — L3/L4 maps plus registered plan-delta/evidence/QA overflow locations.
- `docs/specs/` — durable feature/system specifications.
- `docs/decisions/` — ADRs.
- `tickets/` — executable dependency graph and primary ticket evidence/state.
- `docs/templates/` — canonical artifact templates.

## Agent harness

- `.agents/router.json` — small hot routing policy.
- `.agents/artifacts.json` — artifact types, canonical locators, templates, producers, mutators, and agent/skill artifact contracts.
- `.agents/catalog.json` — full cold inventory for maintenance/audit.
- `.agents/ownership.json` — machine-readable path ownership.
- `.agents/agents/` — role contracts.
- `.agents/rules/` — invariant engineering rules.
- `.agents/skills/` — procedures invoked by routes/roles, including manual `prd-creation`.
- `.codex/` — optional Codex runtime adapters; not a second source of workflow truth.

## Principle

Load only what the current route needs. Repository structure is memory; indiscriminate context loading defeats the design. Resolve `.agents/artifacts.json` before creating durable workflow output instead of inventing a destination.
