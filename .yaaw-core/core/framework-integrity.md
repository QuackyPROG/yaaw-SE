# Framework integrity contract

## Purpose
Keep autonomous project execution inside an immutable package boundary. Package-managed YAAW framework semantics are inputs to consumer workflows, never workflow outputs.

## Ownership classes

Package-managed framework content includes:

- `.yaaw-core/core/**`
- `.yaaw-core/roles/**`
- `.yaaw-core/workflows/**`
- `.yaaw-core/expertise/**`
- `.yaaw-core/rules/**`
- `.yaaw-core/registries/**`
- `.yaaw-core/schemas/**`
- `.yaaw-core/templates/**`
- `.yaaw-core/tools/**`

The installer owns replacement of those files and records their package hashes in `.yaaw-core/install/manifest.json`.

Project-owned durable semantics live only under `.yaaw-core/project/**`. Replaceable coordination lives under `.yaaw-core/runtime/**`.

## Runtime invariant

PRD, Planner, Implementer, Reviewer, and Orchestrator must never intentionally create, edit, delete, rename, or weaken package-managed framework content during normal consumer execution.

A role discovering a broken framework contract reports it; it does not repair the governing contract that constrained it.

Temporary framework edits are also forbidden. Restoring the bytes later does not make the intermediate execution trustworthy.

## Integrity gate

Before semantic reconciliation or dispatch, Orchestrator runs:

```text
node .yaaw-core/tools/framework-integrity.mjs --workspace <WORKSPACE_ROOT>
```

Allowed runtime status is exactly `HEALTHY`.

The following statuses stop semantic routing:

- `MODIFIED`
- `MISSING`
- `LOCAL_OVERRIDE`
- `LEGACY_LAYOUT`
- `MANIFEST_INVALID`
- `UNKNOWN`

A framework-integrity stop does not authorize a project lifecycle transition. It invalidates executable handoffs and requires installer repair/update before orchestration resumes.

## Typed failures

Use:

- `FRAMEWORK_INTEGRITY_VIOLATION` when package-managed bytes/layout differ from the installed manifest.
- `FRAMEWORK_INTEGRITY_UNKNOWN` when integrity cannot be established safely.
- `FRAMEWORK_CONTRACT_INCONSISTENCY` when canonical package contracts contradict one another even though package bytes are intact.

A framework failure is distinct from a project `BLOCKED` ticket. Do not mutate ticket state merely to represent package failure.

## Repair authority

Orchestrator may recommend the installer repair command, but only installer authority may replace package-managed files.

The safe repair pattern is backup-and-replace. Package updates and repairs invalidate replaceable runtime handoff/observation/intent caches so no executable dispatch survives a framework basis change:

```text
npx yaaw-se install --action repair --conflict-policy backup-replace --yes
```

Repair preserves `.yaaw-core/project/**`, may invalidate `.yaaw-core/runtime/**`, verifies the canonical package, and commits the installation manifest last.

## No self-exemption

No workflow, role, expertise module, project rule, handoff, or runtime observation may override this contract during consumer execution.
