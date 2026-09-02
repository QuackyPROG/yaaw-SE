# Ownership and Authority

Ownership is explicit so agents can retrieve the correct context and fail closed on unexpected scope expansion. `.agents/ownership.json` is the machine-readable **path ownership** registry. `.agents/artifacts.json` separately defines **artifact type, canonical destination, producer, template, and semantic mutation authority**.

## Core ownership

| Path / artifact | Primary owner | Mutation rule |
|---|---|---|
| `AGENTS.md` | Orchestrator | Harness-maintenance change; QA required |
| `.agents/router.json` | Orchestrator | Routing-policy change; Planner consulted for semantics; QA required |
| `.agents/catalog.json` | Orchestrator | Inventory maintenance; QA required |
| `.agents/ownership.json` | Orchestrator | Path ownership architecture change; Planner + QA required |
| `.agents/artifacts.json` | Orchestrator + Planner | Artifact-addressing/authority change; QA required |
| `.agents/agents/orchestrator.md` | Orchestrator | Self-policy maintenance; independent QA required |
| `.agents/agents/planner.md` | Planner | Planner-role maintenance; independent QA required |
| `.agents/agents/discovery.md` | Discovery | Discovery-role maintenance; independent QA required |
| `.agents/agents/implementer.md` | Implementer | Implementation-policy maintenance; independent QA required |
| `.agents/agents/qa.md` | QA | QA-policy maintenance; review by Orchestrator + fresh QA context |
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
| `docs/specs/**` | Planner | Behavior specs; implementation does not silently edit acceptance |
| `docs/initiatives/**` | Planner | Maps/deltas; artifact registry grants bounded evidence/QA overflow writes to other roles |
| `docs/workflow/**` | Orchestrator | Harness process documentation |
| `tickets/**` | Orchestrator + Planner | Path ownership; `.agents/artifacts.json` refines section-level evidence/state authority |
| `.codex/**` | Orchestrator | Runtime adapter only; must remain aligned with `.agents` policy |
| `scripts/validate_*` / `scripts/verify_*` | QA + Orchestrator | Mechanical policy enforcement |
| `.github/workflows/**` | Release Engineer | CI/release boundary; QA required |

## Path ownership vs artifact authority

Path ownership alone does not authorize arbitrary semantic edits inside the path. Examples:

- Planner owns the DELIVERY ticket's decomposition/acceptance structure; Implementer may append only registered implementation evidence and contract-authorized state.
- QA may write the registered QA result/overflow evidence even though Planner/Orchestrator own the broader ticket/initiative path.
- Release Engineer may write delivery refs/state after admission but cannot change product acceptance.
- `CANONICAL_DOC_UPDATE` follows the existing canonical owner; it is not permission to create a parallel memory file.

Resolve `.agents/artifacts.json` first whenever the question is "where does this output go?" Resolve `.agents/ownership.json` when the question is "who owns this concrete path/subsystem?"

## Product/domain code

The generic harness cannot know a consuming repository's code owners. A domain pack must extend `.agents/ownership.json` with concrete subsystem paths, risk boundaries, specialist owners, verification commands, and any additional artifact types/contracts it genuinely needs.

Until ownership is registered, code is `UNKNOWN_OWNER`. The correct route is bounded discovery/reclassification, not guessing.

## Authority boundaries

- **Orchestrator** routes and manages ticket/frontier state but does not invent product decisions.
- **Planner** changes unresolved planning artifacts/graph structure but does not mark implementation complete.
- **Discovery** records evidence but does not convert it into unapproved product intent.
- **Implementer** writes only contract-authorized product scope and implementation evidence.
- **QA** accepts/rejects evidence but does not repair reviewed code in the same context.
- **Release Engineer** integrates/delivers accepted work but may not manufacture QA or human promotion authority.
