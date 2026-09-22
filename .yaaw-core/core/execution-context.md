# Execution context

## Purpose
Define the runtime boundary for every YAAW workflow so provider shell state, ambient working directory, and repository layout cannot silently change semantic behavior.

## Canonical workspace root
The **workspace root** is the consumer directory that owns the active YAAW installation. Resolve it before repository or application inspection by walking from the provider's current location toward ancestors until `.yaaw-core/install/manifest.json` is found. During recovery of a damaged installation, `.yaaw-core/registries/paths.json` may be used as a fallback marker.

The process current working directory is never authoritative. `.yaaw-core/project/` is the **project memory root**, not the workspace root.

## Repository capability
Repository capability is observed independently from workflow semantics:

- `READY`: Git is available and the workspace is inside a repository; trustworthy identity can be computed.
- `UNVERSIONED`: the workspace is valid but is not inside a Git repository.
- `UNAVAILABLE`: Git cannot be executed or repository inspection is prohibited by the host.
- `ROOT_MISMATCH`: repository ownership cannot be reconciled safely with the resolved workspace.
- `IDENTITY_FAILED`: a repository exists but exact identity cannot be established.

A raw Git failure is evidence to classify; it is never permission to continue as though repository identity succeeded.

## Root-anchored command rule
Every YAAW Git command is explicitly scoped to the resolved workspace:

```text
git -C <WORKSPACE_ROOT> ...
```

Never rely on ambient CWD for `git status`, `git diff`, `git log`, `git rev-parse`, or verification commands.

When the Git top-level is an ancestor of the workspace, repository inspection and worktree hashing are path-scoped to the workspace using the equivalent of `-- .` from `git -C <WORKSPACE_ROOT>`. Unrelated sibling work in a monorepo must not automatically contaminate the workspace identity.

## Workflow requirements
The machine policy in `registries/execution-policy.json` assigns one repository requirement to every workflow:

- `NONE`: repository capability is not a prerequisite.
- `INSPECT`: inspect repository/workspace reality when available; `UNVERSIONED` is representable and does not by itself block the workflow.
- `IDENTITY`: exact repository identity is mandatory; dispatch is blocked unless repository status is `READY`.

PRD work normally uses `NONE`. Planning discovery uses `INSPECT`. Implementation, code review, and implementation recovery use `IDENTITY`.

## Provider invariant
Provider adapters may point to this contract but must not duplicate it. Codex, Claude Code, Gemini CLI, and Cline all execute against the same workspace-root and repository-capability semantics.
