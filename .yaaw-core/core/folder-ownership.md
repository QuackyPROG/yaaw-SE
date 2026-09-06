# Folder ownership contract

Artifact ownership follows semantic authority. Folder location is part of the contract, not a naming preference.

## Canonical project layout

```text
docs/
├── product/
│   └── product.md
├── engineering/
│   ├── engineering.md
│   └── decisions/
├── specs/
└── rules/

.yaaw/
├── tickets/
├── reviews/
├── evidence/
├── runtime/
└── state.json
```

Durable project knowledge belongs in `docs/`. Autonomous execution records and reconstructable routing state belong in `.yaaw/`.

## Ownership matrix

| Area | Content owner | Lifecycle / execution authority | Other roles |
|---|---|---|---|
| `docs/product/**` | Human / PRD | Human / PRD | read-only to downstream roles |
| `docs/engineering/**` | Planner | Planner | downstream roles may detect invalidity but must return to Planner |
| `docs/specs/**` | Planner | Planner | Implementer/Reviewer consume |
| `docs/rules/**` | Planner-controlled promotion | Planner | roles consume as project invariants |
| `.yaaw/tickets/**` | Planner owns ticket contract | Orchestrator owns ticket lifecycle | Implementer executes; Reviewer accepts |
| application source/tests | Implementer within admitted ticket | Implementer | Reviewer inspects |
| `.yaaw/evidence/**` | Implementer | Implementer writes verification evidence | Reviewer verifies |
| `.yaaw/reviews/**` | Reviewer | Reviewer | immutable review rounds; never rewritten by Implementer |
| `.yaaw/runtime/**` | Orchestrator | Orchestrator | replaceable coordination cache |
| `.yaaw/state.json` | Orchestrator | Orchestrator | reconstructable routing cache, not semantic truth |

## Ticket ownership

A ticket is the bounded handoff contract from Planner to Implementer.

Planner owns **content**. Orchestrator owns **lifecycle**. Implementer owns **execution**. Reviewer owns **acceptance**.

- Planner creates tickets only from a current accepted spec.
- Planner owns ticket goal, scope, requirements, non-goals, acceptance criteria, required tests, dependencies, and referenced engineering decisions.
- Once a ticket is `READY`, Implementer must not silently redefine that contract.
- Implementer owns code, tests, and verification evidence for the admitted ticket.
- Reviewer owns acceptance and writes immutable review rounds.
- Orchestrator owns lifecycle transitions and routing, not ticket meaning.
- If implementation exposes an invalid contract, return `REPLAN_REQUIRED`; do not let Implementer rewrite the spec/ticket architecture.

Recommended grouping preserves traceability:

```text
.yaaw/tickets/SPEC-007/TASK-031.md
.yaaw/reviews/SPEC-007/TASK-031/R1.md
.yaaw/evidence/SPEC-007/TASK-031.json
```

## Cross-owner mutation rule

No role may silently rewrite an artifact whose meaning belongs to another role. A downstream role may report invalidity and return control to the owner. Orchestrator may reconcile lifecycle metadata only when repository/artifact evidence is sufficient; it may not rewrite semantic content.
