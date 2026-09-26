# Role I/O and communication contract

YAAW roles communicate through durable artifacts, exact Orchestrator handoffs, and typed results. Roles never privately command peer roles.

## Machine truth
Registries define artifact ownership, role I/O, workflow mapping, execution policy, public intent, reconciliation policy, and exact handoff construction.

## Public-entry invariant
Every public skill is an intent entrypoint. It invokes `orchestration-runtime.mjs --invoke-skill <skill>`; it does not execute semantic role logic directly. Intent may prefer a destination, but it never bypasses framework health, reconciliation, source-current checks, repository policy, or handoff construction.

## Communication topology
```text
public intent
   -> Orchestrator observes/reconciles
   -> one exact handoff
   -> PRD / Planner / Implementer / Reviewer durable output
   -> Orchestrator observes again
```

Worker text is an execution signal, not project truth. Filesystem access never grants semantic authority.
