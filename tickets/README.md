# Tickets

`tickets/` is the durable local executable work graph. Ticket paths are **stable identifiers/locators**, not status folders. Do not move a ticket merely because it changes from READY to DONE; status lives in structured metadata and generated/query views can group it.

Recommended local layout:

```text
tickets/
  <work-or-initiative>/
    DISC-001-discovery-slug.md
    DEC-002-decision-slug.md
    DEL-003-delivery-slug.md
```

Use `docs/templates/`. Structured tickets start with `---yaaw-json` metadata validated by `scripts/validate_workflow_state.py`. Stable IDs are independent of filenames so ordinary renames do not destroy graph identity.

Every durable ticket records:

- stable ID, kind, status, level, parent and owner;
- blocker IDs;
- observable machine-readable acceptance;
- source fingerprints;
- QA disposition;
- DELIVERY scope, expected change surface, risks and side effects;
- human-readable evidence/decision/implementation/QA/delivery sections.

The ready frontier is computed from structured state; it is not inferred from folder placement.

## External trackers

GitHub Issues/Projects, Linear or another tracker may replace local ticket bodies only through an adapter that preserves stable yaaw IDs, blocker semantics, state transitions, authority, canonical source references, QA disposition and controller addressability. Do not claim tracker neutrality while bypassing these invariants.
