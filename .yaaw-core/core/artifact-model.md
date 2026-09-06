# Artifact model

YAAW separates durable project knowledge from autonomous execution state. Canonical patterns are machine-readable in `registries/artifacts.json`; prose must not invent alternate locations.

## Durable knowledge: `docs/`

- `docs/product/product.md`: human-approved product intent and unresolved product questions.
- `docs/engineering/engineering.md`: durable engineering understanding, `ENG-*` decisions, assumptions, risks, frontier, fog, and readiness.
- `docs/engineering/decisions/ENG-*.md`: expanded durable engineering decisions.
- `docs/specs/<SPEC-ID>.md`: coherent accepted engineering contracts referencing product/decision revisions.
- `docs/rules/**`: project-specific reusable invariants promoted from real evidence.

## Workflow state: `.yaaw/`

- `.yaaw/tickets/<SPEC-ID>/<TASK-ID>.md`: bounded implementation contracts created from accepted specs.
- `.yaaw/evidence/<SPEC-ID>/<TASK-ID>-V<VERSION>.json`: immutable machine-readable verification evidence tied to repository identity.
- `.yaaw/reviews/<SPEC-ID>/<TASK-ID>/R<ROUND>.md`: immutable review rounds tied to exact source and repository revisions.
- `.yaaw/runtime/intent.json`: current public-skill desired intent while Orchestrator resolves prerequisites.
- `.yaaw/runtime/observed-state.json`: replaceable orchestration snapshot.
- `.yaaw/runtime/handoff.json`: exact one-dispatch role communication contract, including the role's context policy.
- `.yaaw/state.json`: reconstructable routing cache and last transition provenance.

Application source/tests remain in their native repository locations; the active ticket and handoff delimit which paths an Implementer may change.

## Derived project memory

An optional external/local project-memory provider may retain git rationale, past sessions, architecture observations, conventions, initiatives, and other historical context. That memory is not a canonical YAAW artifact root and has no semantic or lifecycle ownership. It is an advisory cache governed by `core/project-memory.md`; deleting or disabling it must not make the artifact graph unreconstructable.

Markdown artifacts use YAML frontmatter for machine-readable identity/revision/status and a human-readable body for durable reasoning. Schemas validate metadata; core validation rules define required Markdown sections.

Folder ownership is normative in `core/folder-ownership.md`; read/write behavior is normative in `core/io-contract.md`.

Conversation may be retained by an optional project-memory provider, but conversation is never an artifact of record and never the only location of an accepted decision.
