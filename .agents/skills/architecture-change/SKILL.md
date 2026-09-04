---
name: architecture-change
description: Use for architecture, migration, trust-boundary, or repository changes needing compatibility and rollback planning.
---

# Architecture Change

## Artifact contract

Canonical machine contract: `.agents/artifacts.json` -> `contracts.skills.architecture-change`.

- Read: current architecture/code/tests, accepted ADRs, problem/destination, ownership, migration/trust constraints.
- Produce: `ADR`, `ARCHITECTURE_DOC`, `INITIATIVE_MAP`, and required DISCOVERY/DECISION/DELIVERY tickets.
- Resolve all canonical locators/templates from `.agents/artifacts.json` before creation.
- Do not implement dependent architecture work before required decisions are approved and durable.

Architecture work is L4 by default when it materially changes subsystem ownership, public interfaces, persistence/schema, trust boundaries, deployment topology, repository structure, or broad dependency contracts.

## Required planning

1. State problem/destination and architectural forces.
2. Capture current architecture from code/tests/accepted ADRs.
3. Define invariants that must remain true.
4. Compare viable options and consequences.
5. Record approved decision in ADR before dependent implementation.
6. Define compatibility/transition and rollback/recovery strategy.
7. Decompose into progressive tickets, using expand-migrate-contract where appropriate.
8. Define integration, isolation, verification and fresh QA gates.
9. Update ownership/routing/artifact registry/docs when boundaries or artifact semantics move.

Do not turn a preferred refactor into architecture work unless the current requirement actually needs it.
