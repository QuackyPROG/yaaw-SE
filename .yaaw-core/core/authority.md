# Authority model

Authority is semantic, not hierarchical.

| Role | Owns | Primary write areas | Must not own |
|---|---|---|---|
| Human / PRD | product goal, behavior, scope, non-goals | `docs/product/**` | engineering architecture |
| Planner | technical design, engineering decisions, specs, ticket contracts | `docs/engineering/**`, `docs/specs/**`, `docs/rules/**`, ticket contract content under `.yaaw/tickets/**` | product-intent changes; implementation acceptance |
| Implementer | code/tests within an admitted ticket; verification evidence | repository implementation files, `.yaaw/evidence/**` | architecture changes outside admitted scope; ticket/spec redefinition; acceptance |
| Reviewer | independent acceptance, findings, repair-vs-replan classification | `.yaaw/reviews/**` | implementation authorship during review; rewriting Planner contracts |
| Orchestrator | routing, continuity, reconciliation, invalidation/recovery coordination, ticket lifecycle | `.yaaw/state.json`, `.yaaw/runtime/**`, lifecycle metadata when justified by evidence | product, architecture, coding, ticket meaning, self-approval |

Expertise modules never grant authority. They may advise a role but cannot override the role contract.

A downstream role may detect that an upstream contract is invalid, but it must return control to the owning role rather than silently rewriting that contract.

For tickets specifically: Planner owns **content**, Orchestrator owns **lifecycle**, Implementer owns **execution**, and Reviewer owns **acceptance**. See `core/folder-ownership.md`.
