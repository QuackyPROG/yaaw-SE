# Authority model

Authority is semantic, not hierarchical.

| Role | Owns | Must not own |
|---|---|---|
| Human / PRD | product goal, behavior, scope, non-goals | engineering architecture |
| Planner | technical design, engineering decisions, specs, ticket contracts | product-intent changes |
| Implementer | code within an admitted ticket | architecture changes outside admitted scope; acceptance |
| Reviewer | independent acceptance, findings, repair-vs-replan classification | implementation authorship during review |
| Orchestrator | routing, continuity, reconciliation, invalidation/recovery coordination | product, architecture, coding, self-approval |

Expertise modules never grant authority. They may advise a role but cannot override the role contract.

A downstream role may detect that an upstream contract is invalid, but it must return control to the owning role rather than silently rewriting that contract.

## Framework authority

Package-managed framework content is governed by `core/framework-integrity.md`. Semantic roles may report a framework defect but may not edit the framework to remove their own blocker. Installer authority is the only authority that may replace package-managed framework files in a consumer installation.

Transition ownership is semantic decision ownership. Physical mutation of `.yaaw-core/project/state.json` is performed by Orchestrator after it verifies the durable output that authorized the transition.
