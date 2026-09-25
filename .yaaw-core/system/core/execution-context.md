# Execution context

## Purpose
Define one runtime boundary for every YAAW workflow so ambient shell state and provider layout cannot silently change semantics.

## Canonical workspace root
The **workspace root** is the consumer directory that owns the active YAAW installation. Resolve it before repository or application inspection by walking from the provider's current location toward ancestors until `.yaaw-core/install/manifest.json` is found. During recovery of a damaged installation, `.yaaw-core/system/registries/paths.json` may be used as a fallback marker.

The process CWD is never authoritative. `.yaaw-core/project/` is project memory, not the workspace root.

## Framework integrity

After resolving the workspace and before semantic project recovery, run:

```text
node .yaaw-core/tools/framework-integrity.mjs --workspace <WORKSPACE_ROOT>
```

Only `HEALTHY` permits semantic routing. Package drift, missing framework files, local framework overrides, legacy parallel layout, or an invalid manifest produce a typed framework stop and invalidate executable handoffs. Orchestrator reports the condition; it never repairs package-managed files itself.

## Framework integrity

After resolving the workspace and before semantic project recovery, run:

```text
node .yaaw-core/system/tools/framework-integrity.mjs --workspace <WORKSPACE_ROOT>
```

Only `HEALTHY` permits semantic routing. Package drift, missing framework files, local framework overrides, or an invalid manifest produce a typed framework stop and invalidate executable handoffs. Orchestrator reports the condition; it never repairs package-managed files itself.

## Repository capability
- `READY`: repository exists and exact identity is trustworthy.
- `UNVERSIONED`: valid workspace, no Git repository.
- `UNAVAILABLE`: Git or host permission unavailable.
- `ROOT_MISMATCH`: repository/workspace ownership cannot be reconciled.
- `IDENTITY_FAILED`: repository exists but exact identity failed.

## Root-anchored command rule
Every Git command is explicitly scoped:

```text
git -C <WORKSPACE_ROOT> ...
```

When Git top-level is an ancestor, inspection and identity remain workspace-scoped with `-- .`; unrelated sibling changes must not contaminate the active workspace identity.

## Canonical identity execution
For repository identity, every semantic workflow invokes:

```text
node .yaaw-core/tools/repository-identity.mjs --workspace <WORKSPACE_ROOT>
```

No role or workflow may independently compute or reserialize `worktree_digest`. Copy the returned repository identity into state, handoff, evidence, and review records.

## Workflow requirements
The machine policy in `.yaaw-core/system/registries/execution-policy.json` assigns one repository requirement to every workflow:

Provider adapters point to this contract; Codex, Claude Code, Gemini CLI, and Cline do not fork repository semantics.
