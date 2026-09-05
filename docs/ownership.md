# Ownership and Authority

Ownership is explicit so workflow executions can retrieve the correct context and fail closed on unexpected scope expansion. `.agents/ownership.json` is the machine-readable **path ownership** registry. `.agents/artifacts.json` separately defines **artifact type, canonical destination, producer, template, and semantic mutation authority**.

v2 does not register named agents. The identifiers `orchestrator`, `planner`, `discovery`, `implementer`, `qa`, and `release-engineer` are **authority roles** used by controller/artifact policy. They are principals for mutation rules, not files or persistent personas. The public invocation surface is exactly the five `yaaw-*` skills.

## Core ownership

| Path / artifact | Primary authority | Mutation rule |
|---|---|---|
| `AGENTS.md` | Orchestrator | Host-bootstrap/harness-maintenance change; QA required |
| `.agents/router.json` | Orchestrator | Routing-policy change; Planner consulted for semantics; QA required |
| `.agents/catalog.json` | Orchestrator | Skill/authority inventory maintenance; QA required |
| `.agents/ownership.json` | Orchestrator | Path ownership architecture change; Planner + QA required |
| `.agents/artifacts.json` | Orchestrator + Planner | Artifact-addressing/authority change; QA required |
| `.agents/rules/**` | Orchestrator | Invariant policy; affected authority + QA review |
| `.agents/skills/yaaw-prd/**` | Orchestrator | Manual stakeholder product-intent workflow |
| `.agents/skills/yaaw-orchestrator/**` | Orchestrator | Root loop/routing entrypoint |
| `.agents/skills/yaaw-planner/**` | Planner | Engineering planning and replanning entrypoint |
| `.agents/skills/yaaw-implement/**` | Implementer | Bounded implementation entrypoint |
| `.agents/skills/yaaw-review/**` | QA | Independent verification/review entrypoint |
| `_yaaw-core/**` | Routed authority | Canonical workflow methodology and internal expertise modules |
| `docs/architecture/**` | Planner | Accepted architecture changes should produce/update ADRs |
| `docs/decisions/**` | Planner | Decisions are durable only after required approval |
| `docs/specs/**` | Planner | Behavior specs; implementation does not silently edit acceptance |
| `docs/initiatives/**` | Planner | Maps/deltas; artifact registry grants bounded evidence/QA overflow writes to other authorities |
| `docs/workflow/**` | Orchestrator | Harness process documentation |
| `tickets/**` | Orchestrator + Planner | Path ownership; `.agents/artifacts.json` refines section-level evidence/state authority |
| `.codex/**` | Orchestrator | Host adapter/generic fresh-context transport only; no named role profiles |
| `scripts/validate_*` / `scripts/verify_*` | QA + Orchestrator | Mechanical policy enforcement |
| `.github/workflows/**` | Release authority | CI/release boundary; QA required |

## Path ownership vs artifact authority

Path ownership alone does not authorize arbitrary semantic edits inside the path. Examples:

- Planner owns the DELIVERY ticket's decomposition/acceptance structure; implementation execution may append only registered implementation evidence and contract-authorized state.
- QA authority may write the registered QA result/overflow evidence even though Planner/Orchestrator own the broader ticket/initiative path.
- Conditional release authority may write delivery refs/state after admission but cannot change product acceptance.
- `CANONICAL_DOC_UPDATE` follows the existing canonical owner; it is not permission to create a parallel memory file.

Resolve `.agents/artifacts.json` first whenever the question is "where does this output go?" Resolve `.agents/ownership.json` when the question is "who owns this concrete path/subsystem?"

## Product/domain code

The generic harness cannot know a consuming repository's code owners. A domain pack must extend `.agents/ownership.json` with concrete subsystem paths, risk boundaries, specialist owners, verification commands, and any additional artifact types/contracts it genuinely needs.

Until ownership is registered, code is `UNKNOWN_OWNER`. The correct route is bounded discovery/reclassification, not guessing.

## Authority boundaries

- **Orchestrator authority** routes and manages ticket/frontier state but does not invent product decisions.
- **Planner authority** changes unresolved planning artifacts/graph structure but does not mark implementation complete.
- **Discovery authority** records bounded evidence but does not convert it into unapproved product intent.
- **Implementer authority** writes only contract-authorized product scope and implementation evidence.
- **QA authority** accepts/rejects evidence but does not repair reviewed code in the same review context.
- **Release authority** integrates/delivers accepted work but may not manufacture QA or human promotion authority.

Freshness or parallelism may be implemented with generic bounded execution contexts. Those contexts receive one selected skill plus a handoff; they do not become named agents or independent sources of authority.
