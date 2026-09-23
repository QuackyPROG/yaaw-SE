# Repository capability and identity

Repository capability and repository identity are related but distinct.

## Canonical rule

No semantic workflow may independently calculate `worktree_digest`. All repository identity used in state, handoff, verification, recovery, or review must originate from:

```text
node .yaaw-core/tools/repository-identity.mjs --workspace <WORKSPACE_ROOT>
```

The tool emits machine-readable JSON on stdout, diagnostics on stderr, and exits non-zero when exact identity cannot be produced. The algorithm identifier is `yaaw-worktree-v1`. The implementation in `.yaaw-core/tools/repository-identity.mjs` is the only implementation of that algorithm. Roles and workflows **must not reimplement** it.

## Canonical digest inputs

All commands execute with `git -C <WORKSPACE_ROOT>` and remain workspace-scoped:

1. `git status --porcelain=v1 -z --untracked-files=all -- .`
2. `git diff --binary --no-ext-diff --no-textconv HEAD -- .`
3. `git diff --cached --binary --no-ext-diff --no-textconv HEAD -- .`
4. `git ls-files --others --exclude-standard -z -- .`

Hash raw stdout bytes. Never hash stderr, warnings, timestamps, absolute paths, ambient CWD, PIDs, or hostnames.

Untracked paths are slash-normalized and sorted. Regular files are hashed from exact bytes. Symlinks are hashed from their exact link-target representation. Unsupported or unreadable objects produce `IDENTITY_FAILED`; they are never silently omitted.

The final digest is SHA-256 over stable canonical UTF-8 JSON containing algorithm, workspace-relative scope, HEAD, component hashes, and the sorted untracked manifest.

Repository path ownership does not imply acceptance irrelevance. `.codex/`, `.agents/`, `.claude/`, `.gemini/`, `.cline/`, and `.yaaw-core/runtime/` are not automatically ignored because repository-wide checks may inspect them.

When the Git top-level is an ancestor, unrelated sibling changes remain outside identity because all commands are scoped to the active workspace.
