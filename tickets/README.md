# Tickets

`tickets/` is the durable executable work graph for material local-file tracking. A consuming project may use GitHub Issues/Projects, Linear, or another tracker instead; the semantics stay the same.

Recommended local layout:

```text
tickets/
  active/
  completed/
  superseded/
```

Use templates from `docs/templates/`.

Every durable ticket should have:

- stable identity and title;
- kind: DISCOVERY, DECISION, or DELIVERY;
- parent initiative/spec when applicable;
- blockers;
- status;
- owner/subsystem;
- acceptance/output definition;
- allowed/forbidden scope for DELIVERY;
- verification/QA disposition;
- links to evidence/decisions instead of copied thread history.

The frontier consists of open unblocked tickets. A Planner changes graph structure through a recorded `PLAN_DELTA`; Implementers do not silently rewrite dependencies.
