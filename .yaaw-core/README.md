# `.yaaw-core`

`.yaaw-core/` is the single project-local YAAW root.

Its ownership boundaries are structural:

```text
.yaaw-core/
├── system/   package-owned canonical YAAW implementation
├── project/  durable project-owned semantic memory
├── runtime/  replaceable coordination caches
└── install/  installer metadata
```

Normal package updates refresh `.yaaw-core/system/`; they never replace the whole `.yaaw-core/` tree.

## System composition

```text
skills/ -> system/registries -> deterministic orchestration preparation
        -> role + workflow + applicable shared rules + selected expertise
        -> durable project artifacts + repository reality
        -> evidence-backed state transition
        -> orchestration re-preparation
```

Roles own semantic authority. Workflows own process. Shared rules provide reusable cross-cutting behavior without creating another authority or lifecycle layer. Expertise provides specialist knowledge only.

The canonical assumption-challenge rule is `.yaaw-core/system/rules/assumption-challenge.md`. PRD consumes it for product-semantics scrutiny and Planner consumes it for repository-backed engineering scrutiny. It is not a public skill, workflow phase, state, or durable artifact.

## Authority

- Human/PRD: product intent and scope.
- Planner: engineering decisions, specs, readiness, tickets.
- Implementer: bounded code changes within an admitted ticket.
- Reviewer: independent acceptance and defect classification.
- Orchestrator: continuity, reconciliation, invalidation coordination, and routing/dispatch.

## Durable project root

`.yaaw-core/project/` stores product, engineering, admitted research, specs, tickets, reviews, evidence, project rules, and `state.json`.

`.yaaw-core/runtime/` stores replaceable observed-state, handoff, intent, and dispatch-failure caches used only for coordination. Repository identity v2 excludes runtime caches plus the lifecycle-generated state/evidence/review outputs whose writes would otherwise self-invalidate their attestations; product, engineering, research, specs, tickets, rules, framework/install files, provider config, and application files remain observable.

`.yaaw-core/install/` stores package/install ownership and version metadata. Installer metadata is not semantic project truth.

## Canonical lifecycle

`PRD -> planning -> readiness -> spec -> tickets -> implement -> review -> repair/replan/pass -> next frontier -> COMPLETE`.

Read these package contracts together:

- `.yaaw-core/system/core/lifecycle.md`
- `.yaaw-core/system/core/authority.md`
- `.yaaw-core/system/core/routing.md`
- `.yaaw-core/system/core/transitions.md`
- `.yaaw-core/system/core/invalidation.md`
- `.yaaw-core/system/core/recovery.md`
- `.yaaw-core/system/core/context-loading.md`
- `.yaaw-core/system/rules/assumption-challenge.md`
- `.yaaw-core/system/rules/question-format.md`

Any workflow context may disappear after durable output without destroying project understanding.

## Runtime hardening

- `.yaaw-core/system/core/framework-integrity.md` plus the single `.yaaw-core/system/tools/framework-integrity.mjs` make package health a fail-closed prerequisite.
- `.yaaw-core/system/tools/repository-identity.mjs` is the only worktree digest implementation (`yaaw-worktree-v2`).
- `.yaaw-core/system/tools/orchestration-runtime.mjs` performs framework check, repository identity, metadata inspection, route selection, and handoff construction from one deterministic basis; Orchestrator consumes its typed result instead of reconstructing those steps manually.
- `.yaaw-core/system/registries/handoff-policy.json` keeps route-to-handoff semantics machine-readable and checked against role I/O.
- `.yaaw-core/system/core/execution-context.md` resolves the consumer workspace root and requires root-anchored Git.
- `.yaaw-core/system/registries/execution-policy.json` classifies every workflow as `NONE`, `INSPECT`, or `IDENTITY` for repository requirements.
- `.yaaw-core/system/core/context-loading.md` requires metadata-first progressive workflow loading.
- `.yaaw-core/system/core/io-contract.md` plus `.yaaw-core/system/registries/role-io.json` keep peer roles from privately delegating or searching for alternate YAAW artifact locations.
- Planner owns admitted primary-source research through `.yaaw-core/project/research/RSH-*.md`; `.yaaw-core/system/rules/research-admission.md` prevents host skill availability from choosing architecture.

## Update safety

Current installers emit `yaaw.installation/v2` and accept the original v1 manifest for upgrade. The installer tracks YAAW/system/project/install/adapter versions independently, plans skipped-version project migrations through registered adjacent steps, blocks unsupported downgrades, verifies before manifest commit, and rolls back failed transactions.

Installer-managed mutations beneath `.yaaw-core/project/` are rejected at preflight. Only initialization-if-missing and explicit registered project-schema migrations may transform durable project state.

## State and review ownership

`.yaaw-core/project/state.json` is the current lifecycle ledger for workflow admission. Ticket frontmatter status is historical/artifact metadata and does not override reconciled lifecycle state.

Reviewer reads state but writes only immutable review rounds. Orchestrator validates the durable review result and applies exactly the corresponding state transition/provenance; it never substitutes its own acceptance judgment.
