# Folder ownership contract

Artifact ownership follows semantic authority. Folder location is part of the contract, not a naming preference. Canonical path patterns are also encoded in `registries/artifacts.json`.

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

An optional project-memory provider is a derived advisory cache, not another canonical project folder. YAAW must not create a parallel memory-owned source of truth that duplicates current product/engineering/spec/ticket/review/state authority.

## Ownership matrix

| Area | Content owner | Lifecycle / execution authority | Other roles |
|---|---|---|---|
| `docs/product/**` | Human / PRD | Human / PRD | read-only to downstream roles |
| `docs/engineering/**` | Planner | Planner | downstream roles may detect invalidity but must return to Planner |
| `docs/specs/**` | Planner | Planner | Implementer/Reviewer consume only exact handoff references |
| `docs/rules/**` | Planner-controlled promotion | Planner | roles consume only relevant rules |
| `.yaaw/tickets/**` | Planner owns ticket contract | Orchestrator owns ticket lifecycle | Implementer executes; Reviewer accepts |
| application source/tests | Implementer within admitted ticket | Implementer | Reviewer inspects |
| `.yaaw/evidence/**` | Implementer | Implementer writes immutable verification evidence | Reviewer verifies exact referenced evidence |
| `.yaaw/reviews/**` | Reviewer | Reviewer | immutable review rounds; never rewritten by Implementer |
| `.yaaw/runtime/**` | Orchestrator | Orchestrator | role communication/routing cache only |
| `.yaaw/state.json` | Orchestrator | Orchestrator | reconstructable routing cache, not semantic truth |
| optional project memory | none; derived only | none | advisory reads governed by context policy; never a write-authority substitute |

## Ticket ownership

A ticket is the bounded handoff contract from Planner to Implementer.

Planner owns **content**. Orchestrator owns **lifecycle**. Implementer owns **execution**. Reviewer owns **acceptance**.

- Planner creates ticket contract content only from a current accepted spec.
- New tickets start `DRAFT`; Planner may return that a ticket is admission-ready, but Orchestrator persists `DRAFT -> READY`.
- Once a ticket is `READY`, Implementer must not silently redefine the contract.
- Implementer owns code, tests, and immutable verification evidence for the admitted ticket.
- Reviewer owns immutable review rounds and acceptance classification.
- Orchestrator persists lifecycle transitions and routing, not ticket meaning.
- If implementation exposes an invalid contract, return `REPLAN_REQUIRED`; do not let Implementer rewrite the spec/ticket architecture.

Canonical grouping is:

```text
.yaaw/tickets/SPEC-007/TASK-031.md
.yaaw/evidence/SPEC-007/TASK-031-V1.json
.yaaw/reviews/SPEC-007/TASK-031/R1.md
```

## First-use initialization

Users are never required to pre-create YAAW folders or artifacts.

Before an entry workflow assumes canonical artifacts exist, Orchestrator/PRD must run the idempotent project bootstrap behavior equivalent to `python scripts/init_project.py .`. Missing `docs/`, missing `.yaaw/`, or partially populated canonical trees are normal recoverable state.

Bootstrap creates only missing canonical folders/templates/state. Existing durable artifacts remain authoritative; never overwrite them during bootstrap.

Project-memory initialization, seeding, or provider availability is never part of the canonical folder bootstrap prerequisite.

## Cross-owner mutation rule

No role may silently rewrite an artifact whose meaning belongs to another role. A downstream role may report invalidity and return control to the owner. Orchestrator may reconcile lifecycle metadata only when repository/artifact evidence is sufficient; it may not rewrite semantic content.

Memory retrieval/correction does not confer permission to rewrite another owner's canonical artifact. Exact read/write sets for each dispatch follow `core/io-contract.md` and `registries/role-io.json`.
