# Artifact model

Canonical consumer workspace root is the directory containing the active YAAW installation. Canonical durable **project memory root** is `.yaaw-core/project/`.

Ownership is separated under one YAAW root:

- `.yaaw-core/system/core/`, `.yaaw-core/system/roles/`, `.yaaw-core/system/workflows/`, `.yaaw-core/system/expertise/`, `.yaaw-core/system/rules/`, `.yaaw-core/system/registries/`, `.yaaw-core/system/schemas/`, `.yaaw-core/system/templates/`, and `.yaaw-core/system/tools/`: package-managed framework content.
- `.yaaw-core/project/`: durable project-owned semantic memory.
- `.yaaw-core/runtime/`: replaceable coordination state.
- `.yaaw-core/install/`: installer metadata only.

Durable project artifacts:

- `product.md`: human-approved product intent and unresolved product questions.
- `engineering.md`: durable engineering understanding, `ENG-*` decisions, assumptions, risks, frontier, future fog, and readiness.
- `research/RSH-*.md`: bounded external engineering research owned by Planner; research facts are not engineering decisions until promoted through normal planning.
- `specs/SPEC-*.md`: coherent engineering contracts referencing product/decision revisions.
- `tickets/TASK-*.md`: bounded implementation contracts.
- `reviews/TASK-*-R*.md`: immutable review rounds tied to exact source and repository revisions.
- `evidence/*.json`: machine-readable verification evidence tied to repository identity.
- `.yaaw-core/project/rules/`: project-specific reusable invariants promoted from real evidence.
- `state.json`: reconstructable routing cache and last transition provenance.

Replaceable runtime artifacts:

- `.yaaw-core/runtime/observed-state.json`: observed orchestration snapshot including repository capability.
- `.yaaw-core/runtime/handoff.json`: exact dispatch contract.
- `.yaaw-core/runtime/intent.json`: optional desired-outcome cache used while prerequisites are resolved.

Installer metadata:

- `.yaaw-core/install/manifest.json`: package/integration ownership and version state. It is never semantic project truth.

Markdown artifacts use YAML frontmatter for machine-readable identity/revision/status and a human-readable body for durable reasoning. Machine-readable ownership patterns live in `.yaaw-core/system/registries/artifacts.json`.

Conversation is never an artifact of record. Package update logic must never treat `.yaaw-core/project/` as replaceable framework content.

## Framework immutability

Package-managed `.yaaw-core/system/**` content is not a semantic output surface. Normal PRD, Planner, Implementer, Reviewer, and Orchestrator workflows must not modify it. The installation manifest and `.yaaw-core/system/core/framework-integrity.md` define the runtime trust boundary.

If package-managed framework bytes drift, semantic orchestration stops before project-state reconciliation. Installer repair may replace package content and runtime caches, but must preserve `.yaaw-core/project/**`.
