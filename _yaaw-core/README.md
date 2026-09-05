# yaaw-core v2

`_yaaw-core/` is the canonical methodology behind the small public yaaw-SE skill surface.

Public skills are entry points. They do not carry the whole method. A skill loads the smallest applicable workflow and modules from this directory, while the existing deterministic controller remains authoritative for graph legality, READY-frontier admission, ownership, authority, leases, budgets, freshness, and mutation safety.

## Public skills

- `yaaw-prd` — stakeholder-facing product discovery and PRD refinement.
- `yaaw-orchestrator` — the normal post-PRD entry point; observe state, route, dispatch, repeat.
- `yaaw-planner` — engineering planning: repository investigation, architecture/technical decisions, SPECs, dependency graph, and READY ticket frontier.
- `yaaw-implement` — implement exactly one admitted bounded contract.
- `yaaw-review` — fresh independent review returning PASS, REPAIR, REPLAN, or BLOCKED.

Conditional release/integration remains controller/policy-driven from the v1 substrate until a dedicated v2 release workflow is justified. It is intentionally not a sixth public skill in this version.

## Core loop

```text
accepted PRD
    ↓
yaaw-orchestrator
    ↓
READY work? ── yes ─→ yaaw-implement → yaaw-review
    │                                ↙     ↓      ↘
    no                            PASS   REPAIR   REPLAN
    ↓                               │      │        │
yaaw-planner                        │      └→ implement
    ↓                               │               │
SPEC(s) + READY tickets             └────→ orchestrator
    │                                               │
    └───────────────────────────────────────────────┘
```

When no READY work exists but accepted work remains, Orchestrator invokes Planner. Planner plans only far enough to establish a safe executable frontier. Distant future work stays intentionally lower-resolution until current repository evidence makes it worth specifying.

## L0-L4

The existing L0-L4 model remains. Levels select planning depth, assurance, and workflow/module requirements; they are not separate public skills.

- L0 MICRO — direct bounded implementation/self-verification when safe; no Planner by default.
- L1 BOUNDED — bounded contract, fresh Implementer by default; Planner only when needed.
- L2 PLANNED_FEATURE — Planner + durable SPEC/tickets + independent Review.
- L3 INITIATIVE — progressive SPECs, rolling frontier, independent Review.
- L4 PROGRAM_ARCHITECTURE / HIGH ASSURANCE — L3 loop plus mandatory risk-specific modules/evidence such as security, migration, rollback, trust, or compatibility.

## Modules

A module is internal expertise, not a public workflow action. Planner/Implement/Review load modules only when their applicability rules match the current work. Example: frontend work may load `frontend-design`; authentication work may load `security`; persistent schema work may load `migration`.

Modules may guide several workflows so the same engineering decision is planned, implemented, and reviewed consistently.
