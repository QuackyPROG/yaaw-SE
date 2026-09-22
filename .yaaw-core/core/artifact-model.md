# Artifact model

Canonical durable project root: `.yaaw-core/project/`.

Ownership is separated by subdirectory under one YAAW root:

- `.yaaw-core/core/`, `roles/`, `workflows/`, `expertise/`, `rules/`, `registries/`, `schemas/`, and `templates/`: package-managed framework content.
- `.yaaw-core/project/`: durable project-owned semantic memory.
- `.yaaw-core/runtime/`: replaceable coordination state.
- `.yaaw-core/install/`: installer metadata only.

Durable project artifacts:

- `product.md`: human-approved product intent and unresolved product questions.
- `engineering.md`: durable engineering understanding, `ENG-*` decisions, assumptions, risks, frontier, fog, and readiness.
- `specs/SPEC-*.md`: coherent engineering contracts referencing product/decision revisions.
- `tickets/TASK-*.md`: bounded implementation contracts.
- `reviews/TASK-*-R*.md`: immutable review rounds tied to exact source and repository revisions.
- `evidence/*.json`: machine-readable verification evidence tied to repository identity.
- `rules/`: project-specific reusable invariants promoted from real evidence.
- `state.json`: reconstructable routing cache and last transition provenance.

Replaceable runtime artifacts:

- `.yaaw-core/runtime/observed-state.json`: observed orchestration snapshot.
- `.yaaw-core/runtime/handoff.json`: dispatch contract.
- `.yaaw-core/runtime/intent.json`: optional current intent cache.

Installer metadata:

- `.yaaw-core/install/manifest.json`: package/integration ownership and version state. It is never semantic project truth.

Markdown artifacts use YAML frontmatter for machine-readable identity/revision/status and a human-readable body for durable reasoning. Schemas validate metadata; core validation rules define required Markdown sections.

Conversation is never an artifact of record. Package update logic must never treat `.yaaw-core/project/` as replaceable framework content.
