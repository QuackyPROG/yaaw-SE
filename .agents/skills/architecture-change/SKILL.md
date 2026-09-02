---
name: architecture-change
description: Plan and govern high-blast-radius architecture, migration, trust-boundary and repository-structure changes with explicit invariants, compatibility, rollback, sequencing and QA.
---

# Architecture Change

Architecture work is L4 by default when it materially changes subsystem ownership, public interfaces, persistence/schema, trust boundaries, deployment topology, repository structure, or broad dependency contracts.

## Required planning

1. State problem/destination and architectural forces.
2. Capture current architecture from code/tests/accepted ADRs; do not infer from stale prose alone.
3. Define invariants that must remain true.
4. Compare viable options and consequences.
5. Record the approved decision in an ADR before dependent implementation.
6. Define compatibility/transition and rollback/recovery strategy.
7. Decompose into progressive tickets, using expand–migrate–contract where appropriate.
8. Define integration points, isolated worktree/branch needs, verification and fresh QA gates.
9. Update ownership/routing/docs when boundaries move.

Do not turn a preferred refactor into architecture work unless the current requirement actually needs it.
