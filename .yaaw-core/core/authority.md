# Authority model

Authority is semantic, not hierarchical.

| Role | Owns | Must not own |
|---|---|---|
| PRD/Human | product goal, behavior, scope, non-goals | engineering architecture |
| Planner | technical design, decisions, specs, ticket contracts | product-intent changes |
| Implementer | code within ticket contract | architecture changes outside admitted scope; acceptance |
| Reviewer | independent acceptance, findings, repair-vs-replan classification | implementation authorship during review |
| Orchestrator | routing, continuity, state reconciliation | product, architecture, coding, self-approval |

Expertise modules never grant authority. They may advise a role but cannot override the role's contract.
