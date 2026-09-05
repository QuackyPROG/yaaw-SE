# Artifact model

Canonical project root: `.yaaw/`.

- `product.md`: human-approved product intent. Owned by PRD/human authority.
- `engineering.md`: durable engineering understanding, `ENG-*` decisions, assumptions, risks, frontier, and fog. Owned by Planner.
- `specs/SPEC-*.md`: coherent engineering contracts referencing decision IDs.
- `tickets/TASK-*.md`: bounded implementation contracts.
- `reviews/TASK-*-R*.md`: immutable review rounds.
- `evidence/`: test or verification evidence tied to repository state.
- `rules/`: project-specific reusable invariants promoted from real evidence.
- `state.json`: reconstructable routing cache.

Conversation is never an artifact of record.
