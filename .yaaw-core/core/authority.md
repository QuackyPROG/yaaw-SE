# Authority model

Authority is semantic, not hierarchical. Orchestrator controls routing and lifecycle state, while semantic roles own the judgments and artifacts in their domains.

| Role | Owns | Primary semantic write areas | Must not own |
|---|---|---|---|
| Human / PRD | product goal, behavior, scope, non-goals | `docs/product/**` | engineering architecture |
| Planner | technical design, engineering decisions, specs, ticket contracts | `docs/engineering/**`, `docs/specs/**`, `docs/rules/**`, ticket contract content under `.yaaw/tickets/**` | product-intent changes; implementation acceptance |
| Implementer | code/tests within one admitted ticket; verification evidence | ticket-admitted repository files, `.yaaw/evidence/**` | architecture changes outside scope; ticket/spec redefinition; acceptance |
| Reviewer | independent acceptance, findings, repair-vs-replan classification | `.yaaw/reviews/**` | implementation authorship during review; rewriting Planner contracts |
| Orchestrator | routing, continuity, reconciliation, intent, lifecycle persistence | `.yaaw/state.json`, `.yaaw/runtime/**`, ticket lifecycle metadata | product, architecture, coding, ticket meaning, self-approval |

Expertise modules never grant authority. They may advise a role but cannot override the role contract.

Project memory never grants authority either. It is derived advisory context governed by `core/project-memory.md` and `registries/context-policy.json`. A remembered conversation, commit rationale, convention, or historical implementation may guide where a semantic role looks, but only current human authority, canonical artifacts, repository/evidence reality, and the owning role's verified judgment can change current truth.

A downstream role may detect that an upstream contract is invalid, but it returns a typed result to Orchestrator rather than spawning the owning role directly. Orchestrator then routes to the correct owner.

Semantic roles author the evidence/judgment for lifecycle outcomes. Orchestrator is the state writer: it validates durable output against `registries/transitions.json`, persists the legal transition, and determines the next workflow.

For tickets specifically: Planner owns **content**, Orchestrator owns **lifecycle**, Implementer owns **execution**, and Reviewer owns **acceptance**. See `core/folder-ownership.md` and `core/io-contract.md`.
