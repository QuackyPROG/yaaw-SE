# Artifact model

Canonical project root: `.yaaw/`.

- `product.md`: human-approved product intent and unresolved product questions.
- `engineering.md`: durable engineering understanding, `ENG-*` decisions, assumptions, risks, frontier, fog, and readiness.
- `specs/SPEC-*.md`: coherent engineering contracts referencing product/decision revisions.
- `tickets/TASK-*.md`: bounded implementation contracts.
- `reviews/TASK-*-R*.md`: immutable review rounds tied to exact source and repository revisions.
- `evidence/*.json`: machine-readable verification evidence tied to repository identity.
- `rules/`: project-specific reusable invariants promoted from real evidence.
- `runtime/observed-state.json`: replaceable orchestration snapshot.
- `runtime/handoff.json`: replaceable dispatch contract.
- `state.json`: reconstructable routing cache and last transition provenance.

Markdown artifacts use YAML frontmatter for machine-readable identity/revision/status and a human-readable body for durable reasoning. Schemas validate metadata; core validation rules define required Markdown sections.

Conversation is never an artifact of record.
