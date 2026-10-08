# `.yaaw-core`

`.yaaw-core/` is the single project-local YAAW root.

```text
.yaaw-core/
├── system/   package-owned compact kernel
├── project/  durable project-owned semantic memory
├── runtime/  replaceable derived coordination
└── install/  installer metadata
```

## Mental model
Agents/authority contexts are disposable. Durable artifacts are the memory.

```text
PUBLIC SKILL
    ↓ intent
COMPACT RUNTIME
    ↓ inspect framework/repository/artifacts
DERIVE STATE + ONE LEGAL RECONCILIATION
    ↓ exact route/handoff
ONE SEMANTIC AUTHORITY
    ↓ durable fact
OBSERVE AGAIN
```

PRD owns product meaning. Planner owns engineering meaning, specs, tickets, and `scope_status`. Implementer owns application changes plus implementation evidence. Reviewer owns immutable acceptance judgment. Orchestrator owns observation/routing and may physically update only the ticket lifecycle `status` scalar when durable evidence or an authorized semantic result proves a legal transition.

There is no durable global `state.json`. Ticket status is stored with the ticket contract; product/planning/spec state is derived from their own frontmatter. `.yaaw-core/runtime/` contains only replaceable intent, observation, handoff, and failure caches.

## Compact system
`.yaaw-core/system/` contains:
- `SYSTEM.md` — human-readable invariants and architecture;
- `kernel.yaml` — machine contract for paths, artifacts, roles, workflows, handoffs, skills, modules, and lifecycle;
- `roles/` — five semantic authorities with named operations;
- `modules/` — optional expertise loaded after routing;
- `schemas/` and `templates/` — artifact/runtime contracts;
- `engine/` — integrity, repository identity, frontmatter, routing, and runtime utilities.

The old `core/`, `workflows/`, `rules/`, `registries/`, `expertise/`, and `tools/` semantic directory fan-out is intentionally removed.

## Durable project memory
`.yaaw-core/project/` stores product, engineering, research, specs, tickets, reviews, evidence, and project rules. Runtime caches can be deleted at any time and must be reconstructable from these artifacts plus repository evidence.

Implementation recovery uses immutable `yaaw.evidence/v3` records. Current PASS verification admits review; failed verification remains history. Review outcomes remain immutable; Orchestrator only adopts a legal lifecycle transition after validating their current ticket/spec/repository basis.

Planner-owned `scope_status` is `UNKNOWN | OPEN | COMPLETE`. Completion is derived from current ticket states plus this explicit planner-owned fact; it is never inferred from an empty runnable queue alone.

## Public entrypoints
Every `skills/yaaw-*/SKILL.md` is a thin intent door into `.yaaw-core/system/engine/runtime.mjs`. Shortcuts never bypass framework integrity, reconstruction, source-current validation, repository policy, or exact handoff construction.

## Update safety
Package updates replace managed `.yaaw-core/system/**` and provider adapters but preserve `.yaaw-core/project/**` except explicit typed schema migrations. Project schema v3 transfers legacy lifecycle values from `project/state.json` into owning ticket frontmatter and removes only that legacy ledger. Historical reviews/evidence are never rewritten.
