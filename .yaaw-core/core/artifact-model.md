# Artifact model

YAAW separates durable project knowledge from autonomous execution state.

## Durable knowledge: `docs/`

- `docs/product/product.md`: human-approved product intent and unresolved product questions.
- `docs/engineering/engineering.md`: durable engineering understanding, `ENG-*` decisions, assumptions, risks, frontier, fog, and readiness.
- `docs/engineering/decisions/`: optional expanded decision records when a decision needs its own artifact.
- `docs/specs/SPEC-*.md`: coherent accepted engineering contracts referencing product/decision revisions.
- `docs/rules/`: project-specific reusable invariants promoted from real evidence.

## Workflow state: `.yaaw/`

- `.yaaw/tickets/<SPEC-ID>/TASK-*.md`: bounded implementation contracts created from accepted specs.
- `.yaaw/reviews/<SPEC-ID>/<TASK-ID>/R*.md`: immutable review rounds tied to exact source and repository revisions.
- `.yaaw/evidence/<SPEC-ID>/TASK-*.json`: machine-readable verification evidence tied to repository identity.
- `.yaaw/runtime/observed-state.json`: replaceable orchestration snapshot.
- `.yaaw/runtime/handoff.json`: replaceable dispatch contract.
- `.yaaw/state.json`: reconstructable routing cache and last transition provenance.

Markdown artifacts use YAML frontmatter for machine-readable identity/revision/status and a human-readable body for durable reasoning. Schemas validate metadata; core validation rules define required Markdown sections.

Folder ownership is normative and defined in `core/folder-ownership.md`.

Conversation is never an artifact of record.
