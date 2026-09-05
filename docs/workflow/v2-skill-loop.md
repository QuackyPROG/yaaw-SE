# yaaw-SE v2 skill loop

v2 keeps the deterministic controller/runtime substrate from `main` and simplifies the workflow surface to exactly five locked public skills.

```text
yaaw-prd (manual product definition)
        ↓
yaaw-orchestrator (normal entry point)
        ↓
READY? ─ yes → yaaw-implement → yaaw-review
  │                         PASS / REPAIR / REPLAN / BLOCKED
  no
  ↓
yaaw-planner → progressive SPEC(s) + bounded tickets → controller READY frontier
```

L0-L4 remain internal routing/assurance levels. `_yaaw-core/` contains the large workflow definitions and reusable expertise modules; `.agents/skills/` contains only the five entrypoints.

There is no named-agent layer in v2. `.agents/agents/` and `.codex/agents/` are intentionally absent. Authority-role identifiers remain in machine policy because the controller must still distinguish who may mutate which artifact fields. When freshness or independent review is required, the host may create a generic bounded execution context loaded with one skill plus a `yaaw.handoff/v1` contract; that context is transport, not a durable role/profile.

Planner directly decomposes the current high-resolution SPEC/frontier into tickets. Review does not create solution tickets: ordinary implementation defects return REPAIR on the same contract; contract/architecture failures return REPLAN to Planner.

For large initiatives Planner understands the whole destination at lower resolution but fully specifies only approaching work. When the frontier empties and accepted work remains, Orchestrator invokes Planner again against the repository that now exists.
