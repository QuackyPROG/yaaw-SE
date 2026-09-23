# Framework integrity contract

## Purpose
Keep autonomous project execution inside an immutable package boundary. Package-managed YAAW framework semantics are inputs to consumer workflows, never workflow outputs.

## Ownership classes
Package-managed framework content is everything under `.yaaw-core/system/**`, including core contracts, roles, workflows, expertise, shared rules, registries, schemas, templates, and tools.

The installer owns replacement of those files and records their package hashes in `.yaaw-core/install/manifest.json`.

Project-owned durable semantics live under `.yaaw-core/project/**`. Replaceable coordination lives under `.yaaw-core/runtime/**`.

## Runtime invariant
PRD, Planner, Implementer, Reviewer, and Orchestrator must never intentionally create, edit, delete, rename, or weaken package-managed framework content during normal consumer execution.

A role discovering a broken framework contract reports it. It does not repair the governing contract that constrained it.

Temporary framework edits are forbidden. Restoring the bytes later does not make intermediate execution trustworthy.

## Integrity gate
Before semantic reconciliation or dispatch, Orchestrator runs:

```text
node .yaaw-core/system/tools/framework-integrity.mjs --workspace <WORKSPACE_ROOT>
```

Allowed runtime status is exactly `HEALTHY`.

The following statuses stop semantic routing:

- `MODIFIED`
- `MISSING`
- `LOCAL_OVERRIDE`
- `MANIFEST_INVALID`
- `UNKNOWN`

A framework-integrity stop does not authorize a ticket lifecycle transition. It invalidates executable handoffs and requires installer repair/update before orchestration resumes.

## Typed failures
Use:

- `FRAMEWORK_INTEGRITY_VIOLATION` when package-managed bytes differ from the installation manifest.
- `FRAMEWORK_INTEGRITY_UNKNOWN` when integrity cannot be established safely.
- `FRAMEWORK_CONTRACT_INCONSISTENCY` when intact canonical package contracts contradict one another.

These are installation/runtime trust failures, not ticket states.

## Repair authority
Orchestrator may recommend installer repair, but only installer authority may replace package-managed files.

The safe repair pattern is backup-and-replace. Package update/modify/repair invalidates replaceable runtime handoff/observation/intent caches so no dispatch survives a framework basis change:

```text
npx yaaw-se install --action repair --conflict-policy backup-replace --yes
```

Repair preserves `.yaaw-core/project/**`, restores package-managed framework content, and commits installer metadata only after verification.

## No self-exemption
No role, workflow, expertise module, project rule, handoff, or runtime observation may weaken or override this contract during consumer execution.
