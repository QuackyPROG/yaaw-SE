# Repository capability and identity

Repository capability and repository identity are related but distinct.

## Capability
Resolve the YAAW workspace root using `core/execution-context.md`, then inspect Git with root-anchored commands.

Record one status:
- `READY`: Git repository exists and exact workspace identity is trustworthy.
- `UNVERSIONED`: workspace is valid but not versioned.
- `UNAVAILABLE`: Git or required host permission is unavailable.
- `ROOT_MISMATCH`: workspace/repository ownership cannot be reconciled safely.
- `IDENTITY_FAILED`: repository exists but identity calculation failed.

Also record `workspace_scope`, `git_root_relation` (`same`, `ancestor`, `none`, or `unknown`), and a safe diagnostic in `error` when status is not `READY`.

## Identity
When status is `READY`, record `head_commit`, `dirty`, and `worktree_digest`.

Recommended digest inputs, always executed with `git -C <WORKSPACE_ROOT>`:
1. `git status --porcelain=v1 -z -- .`;
2. `git diff --binary HEAD -- .`;
3. `git diff --cached --binary HEAD -- .`;
4. sorted untracked paths inside the workspace scope and their byte hashes where accessible.

When the Git top-level is an ancestor, unrelated sibling changes are outside the identity scope unless the active ticket explicitly includes them.

If trustworthy identity cannot be produced for a workflow requiring `IDENTITY`, return a typed prerequisite/blocker rather than pretending the state is uniquely identified.
