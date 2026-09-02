# Ownership and Authority

Ownership is explicit so agents can retrieve the correct context and fail closed on unexpected scope expansion. `.agents/ownership.json` is the machine-readable registry; this document is the human explanation.

## Core ownership

| Path / artifact | Primary owner | Mutation rule |
|---|---|---|
| `AGENTS.md` | Orchestrator | Harness-maintenance change; QA required |
| `.agents/router.json` | Orchestrator | Routing-policy change; Planner consulted for semantics; QA required |
| `.agents/catalog.json` | Orchestrator | Inventory maintenance; QA required |
| `.agents/ownership.json` | Orchestrator | Ownership architecture change; Planner + QA required |
| `.agents/agents/orchestrator.md` | Orchestrator | Self-policy maintenance; independent QA required |
| `.agents/agents/planner.md` | Planner | Planner-role maintenance; independent QA required |
| `.agents/agents/discovery.md` | Discovery | Discovery-role maintenance; independent QA required |
| `.agents/agents/implementer.md` | Implementer | Implementation-policy maintenance; independent QA required |
| `.agents/agents/qa.md` | QA | QA-policy maintenance; review by Orchestrator + independent fresh QA context |
| `.agents/agents/release-engineer.md` | Release Engineer | Delivery-policy maintenance; QA required |
| `.agents/rules/**` | Orchestrator | Invariant policy; affected role + QA review |
| `.agents/skills/intake-routing/**` | Orchestrator | Routing procedure |
| `.agents/skills/progressive-planning/**` | Planner | Planning/wayfinding procedure |
| `.agents/skills/ticket-graph/**` | Planner | Ticket decomposition/graph procedure |
| `.agents/skills/plan-delta/**` | Planner | Replanning procedure |
| `.agents/skills/bug-diagnosis/**` | Discovery | Diagnosis evidence procedure |
| `.agents/skills/implementation/**` | Implementer | Bounded delivery procedure |
| `.agents/skills/qa-regression/**` | QA | Independent verification procedure |
| `.agents/skills/documentation-impact/**` | Orchestrator | Durable-memory procedure |
| `.agents/skills/architecture-change/**` | Planner | Architecture/migration procedure |
| `docs/architecture/**` | Planner | Accepted architecture changes should produce/update ADRs |
| `docs/decisions/**` | Planner | Decisions are durable only after required approval |
| `docs/specs/**` | Planner | Product/behavior specs; implementation does not silently edit acceptance |
| `docs/initiatives/**` | Planner | Rolling L3/L4 maps and plan deltas |
| `docs/workflow/**` | Orchestrator | Harness process documentation |
| `tickets/**` | Orchestrator + Planner | Orchestrator manages state/frontier; Planner owns decomposition and graph changes |
| `.codex/**` | Orchestrator | Runtime adapter only; must remain aligned with `.agents` policy |
| `scripts/validate_*` / `scripts/verify_*` | QA | Mechanical policy enforcement; Orchestrator co-owns semantics |
| `.github/workflows/**` | Release Engineer | CI/release boundary; QA required |

## Product/domain code

The generic harness cannot know a consuming repository's code owners. A domain pack must extend `.agents/ownership.json` with concrete subsystem paths, risk boundaries, specialist owners, and verification commands.

Until ownership is registered, code is `UNKNOWN_OWNER`. The correct route is bounded discovery/reclassification, not guessing.

## Authority boundaries

- **Orchestrator** may route and manage ticket state but does not invent product decisions.
- **Planner** may change unresolved planning artifacts/graph structure but does not mark implementation complete.
- **Discovery** may record evidence but does not convert evidence into unapproved product intent.
- **Implementer** may write only the contract's allowed scope and may not change material acceptance or graph structure.
- **QA** may accept/reject evidence but does not repair the code in the same review context.
- **Release Engineer** may integrate/deliver accepted work but may not manufacture missing QA or human promotion authority.
