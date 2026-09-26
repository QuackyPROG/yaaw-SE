# `.yaaw-core`

`.yaaw-core/` is the single project-local YAAW root.

```text
.yaaw-core/
├── system/   package-owned canonical implementation
├── project/  durable project-owned semantic memory
├── runtime/  replaceable coordination caches
└── install/  installer metadata
```

## Mental model

Agents/authority contexts are disposable. Durable artifacts are the memory.

```text
PUBLIC SKILL
    ↓ intent
ORCHESTRATION RUNTIME
    ↓ observe framework/repository/artifacts
RECONCILIATION ENGINE
    ↓ exactly one legal adoption
STATE LEDGER
    ↓ route + exact handoff
ONE SEMANTIC AUTHORITY
    ↓ durable fact
OBSERVE AGAIN
```

PRD owns product meaning. Planner owns engineering meaning, specs, tickets, and `scope_status`. Implementer owns application changes plus implementation-start/verification evidence. Reviewer owns immutable acceptance judgment. Orchestrator alone physically writes `state.json`, but only from durable facts authorized by those roles.

Worker output does not update lifecycle state directly. Workers write durable semantic facts. Orchestrator observes those facts and records legal lifecycle changes.

## Durable project memory

`.yaaw-core/project/` stores product, engineering, research, specs, tickets, reviews, evidence, project rules, and `state.json` (`yaaw.project-state/v2`). Runtime intent/handoff/observed-state caches are replaceable.

Implementation recovery uses `yaaw.evidence/v3`:
- `implementation_start + STARTED` authorizes `READY -> IN_PROGRESS`;
- only current `implementation_verification + PASS` authorizes review admission;
- failed verification remains durable history and never counts as success.

Planner-owned `scope_status` is `UNKNOWN | OPEN | COMPLETE`. Orchestrator cannot infer project completion merely because no READY ticket exists.

## Public entrypoints

Every `skills/yaaw-*/SKILL.md` is a thin intent door into the same orchestration engine. A shortcut never skips framework integrity, reconciliation, source-current validation, repository policy, or exact handoff construction.

## Update safety

Package updates replace `.yaaw-core/system/**` but preserve `.yaaw-core/project/**`. Project schema v1 migrates to v2 by preserving engineering body/history, adding `scope_status`, and regenerating replaceable runtime caches. Historical evidence/reviews are never rewritten.
