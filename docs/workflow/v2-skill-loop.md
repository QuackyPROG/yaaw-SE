# yaaw-SE v2 skill loop

v2 keeps the deterministic controller from main and simplifies only the workflow surface.

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

L0-L4 remain internal routing/assurance levels. `_yaaw-core/` contains large workflow definitions and reusable expertise modules; `.agents/skills/` contains only the five entrypoints.

Planner directly decomposes current high-resolution SPEC/frontier into tickets. Review does not create solution tickets: ordinary implementation defects return REPAIR on the same contract; contract/architecture failures return REPLAN to Planner.

For large initiatives Planner understands the whole destination at lower resolution but fully specifies only approaching work. When the frontier empties and accepted work remains, Orchestrator invokes Planner again against the repository that now exists.
