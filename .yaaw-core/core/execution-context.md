# Execution context

## Purpose
Define one runtime boundary for every YAAW workflow so ambient shell state and provider layout cannot silently change semantics.

## Canonical workspace root
Resolve the consumer workspace by walking toward ancestors until `.yaaw-core/install/manifest.json` is found. During damaged-install recovery, `.yaaw-core/registries/paths.json` may be used as a fallback marker.

The process CWD is never authoritative. `.yaaw-core/project/` is project memory, not the workspace root.

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
`NONE` requires no repository. `INSPECT` may represent `UNVERSIONED`. `IDENTITY` requires status `READY`.

Provider adapters point to this contract; Codex, Claude Code, Gemini CLI, and Cline do not fork repository semantics.
