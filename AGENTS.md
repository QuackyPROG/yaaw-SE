# yaaw-SE Agent Guide

## Purpose

yaaw-SE is a domain-agnostic software-engineering harness for projects and tasks of very different sizes. It provides routing, progressive planning, bounded implementation, independent verification, repository-native memory, controlled multi-agent execution, and explicit artifact addressing.

This file is a navigation map, not an encyclopedia. Durable detail belongs in `docs/` and `.agents/`.

## Required read order

For ordinary work:

1. `AGENTS.md`.
2. `docs/index.md`.
3. The current ticket/spec/map when one exists.
4. `.agents/router.json`.
5. Git status, branch, history, and relevant diff.
6. The smallest relevant code/docs/tests and only the registered procedures required by the route.

Before creating or relocating a durable workflow artifact, also resolve the active role/skill contract through `.agents/artifacts.json`; resolve concrete path ownership through `.agents/ownership.json` when applicable.

Do not scan the whole repository or load `.agents/catalog.json` by default. The catalog is maintenance/audit truth, not normal task context.

## Source-of-truth hierarchy

1. Executable code and tests/verification.
2. Accepted ADRs and architecture contracts.
3. Active specification, initiative map, or durable ticket.
4. Canonical scoped documentation.
5. Current thread/session context.
6. Agent assumptions.

Lower levels yield to higher ones. `UNKNOWN` is a valid result. Investigate before inventing.

## Complexity levels

Use the cheapest safe route:

- **L0 Micro** — tiny local change; ephemeral contract; same-context execution; targeted self-verification.
- **L1 Bounded** — one known-owner task/bug/feature; one fresh Implementer; durable ticket optional when the task is still fully bounded.
- **L2 Planned Feature** — multiple decisions/slices or shared impact; Planner creates/updates durable artifacts and ticket graph; independent QA required.
- **L3 Initiative** — partially known work whose plan must evolve; Planner plus Discovery/decision work; rolling frontier; independent QA required.
- **L4 Program / Architecture** — migration, major architecture, trust boundary, multi-subsystem/repository-scale work; progressive wayfinding, high-assurance gates, independent QA required.

A lower-level task promotes when actual evidence exceeds its assumptions. Do not preserve a cheap route merely because it was selected first.

## Ticket model

Material work uses three ticket kinds:

- **DISCOVERY** — establish what is true.
- **DECISION** — choose what should be true.
- **DELIVERY** — implement one bounded, verifiable vertical slice.

Tickets declare blocking edges. The **frontier** is the set of open tickets whose blockers are complete and whose required decisions/evidence are current.

Huge work is deliberately not fully decomposed upfront. Unknown-but-in-scope work stays as **fog / not-yet-specified** on an initiative map until evidence makes a precise ticket possible.

## Plan changes during implementation

An Implementer never silently expands a material contract. If implementation reveals a new owner, incompatible assumption, architecture decision, dependency, trust boundary, migration, materially different acceptance criterion, or work that no longer fits the current ticket, return `STOP_AND_REPLAN` with evidence.

Only the Planner may issue a durable `PLAN_DELTA`. Allowed outcomes are: continue unchanged; amend unresolved current work; split unresolved work; insert a prerequisite; add follow-up/discovery/decision work; block/resequence unresolved work; promote the initiative level; supersede unresolved future tickets; or create explicit corrective work when completed work is invalidated.

Valid completed work is not rewritten merely because the future plan changes.

## Scope and ownership

`.agents/ownership.json` is the machine-readable path ownership registry. `docs/ownership.md` explains it for humans.

Every implementation contract declares goal/acceptance, owner/subsystem, allowed and forbidden write scope, verification seams, blockers/decisions, QA disposition, and stop/promotion triggers.

Unexpected writes or owner changes mean `STOP_AND_REPLAN`, not opportunistic refactoring.

## Artifact contracts

`.agents/artifacts.json` is the canonical artifact-type, destination, template, producer, and mutation-authority registry. `.agents/ownership.json` answers **who owns a path**; `.agents/artifacts.json` answers **what kind of workflow artifact this is, where it belongs, and which role may change which semantic state**.

Every registered agent and skill has a local `## Artifact contract` section and a matching machine-readable contract in `.agents/artifacts.json`.

Before durable output:

1. identify the active role and skill;
2. resolve their artifact contract;
3. resolve the output artifact type;
4. use the registered canonical locator/template;
5. resolve concrete path ownership when necessary;
6. stop with an artifact-contract gap if destination or authority remains unknown.

Do not invent folders for specs, evidence, QA, plan deltas, or delivery records. Large evidence may use only a registered overflow locator and must be linked from the primary artifact.

## Agent topology

Core roles:

- **Orchestrator** — intake, routing, complexity, ownership, frontier selection, dispatch, integration state.
- **Planner** — specs, initiative maps, decisions, ticket graphs, plan deltas; not a general coder.
- **Discovery** — bounded evidence gathering; does not decide product intent.
- **Implementer** — one bounded delivery contract; does not self-expand scope.
- **QA** — fresh independent review of actual diff vs contract and risk.
- **Release Engineer** — serial delivery/integration/CI/promotion handoff after acceptance.

Only the root Orchestrator delegates. Children do not recursively spawn agents or coordinate peers directly. Parallelize independent read/evidence work within runtime limits; one worktree has at most one active writer. Parallel writers require isolated worktrees/branches.

Fresh context is the default. Planner/Discovery may persist only while the same initiative and evidence remain current. Implementers are fresh per contract (one unchanged-contract repair reuse maximum). QA is always fresh.

## Repository memory

Conversation history is working memory, not canonical project memory. Material decisions, evidence, plan deltas, accepted specs, and QA results must be checkpointed into registered repository artifacts before dependent work or thread retirement.

## Documentation policy

- `docs/architecture/**`: architectural contracts and explanatory architecture.
- `docs/decisions/**`: accepted ADRs.
- `docs/specs/**`: behavior specifications.
- `docs/initiatives/**`: rolling maps for L3/L4 work plus registered evidence/QA overflow.
- `docs/workflow/**`: harness procedures.
- `tickets/**`: executable work graph and primary per-ticket evidence/state sections.
- `.agents/**`: machine/agent policy, artifact registry, role/skill assets.

Update the smallest canonical artifact that owns the changed fact. Do not create giant catch-all memory files.

## Delivery

Repository/domain packs choose their branch strategy, but the generic harness requires: inspect the actual diff, satisfy route verification, obtain required independent QA, run configured CI, and require explicit human authority for protected production/main promotion when the consuming repository says so.

## Prohibited behavior

Do not invent repository facts, agents, skills, artifact destinations, owners, dependencies, runtime capabilities, test results, approvals, or architecture. Do not recursively spawn swarms, run concurrent writers in one worktree, treat thread history as durable truth, silently widen a contract, create speculative abstractions unrelated to acceptance, mark missing QA as skipped, create duplicate durable memory instead of updating its canonical owner, or rewrite completed history to make a new plan look cleaner.
