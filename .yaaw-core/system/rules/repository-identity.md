# Repository capability and identity

Repository capability and repository identity are related but distinct.

## Capability
Resolve the YAAW workspace root using `.yaaw-core/system/core/execution-context.md`, then inspect Git only through the canonical utility.

No semantic workflow may independently calculate `worktree_digest`. All repository identity used in handoff, verification, recovery, or review must originate from:

```text
node .yaaw-core/system/tools/repository-identity.mjs --workspace <WORKSPACE_ROOT>
```

The tool emits machine-readable JSON on stdout, diagnostics on stderr, and exits non-zero when exact identity cannot be produced. The algorithm identifier is `yaaw-worktree-v2`. Roles and workflows **must not reimplement** it.

## Canonical digest inputs
All commands execute with `git -C <WORKSPACE_ROOT>` and remain workspace-scoped:

1. `git status --porcelain=v1 -z --untracked-files=all -- . <control-output exclusions>`
2. `git diff --binary --no-ext-diff --no-textconv HEAD -- . <control-output exclusions>`
3. `git diff --cached --binary --no-ext-diff --no-textconv HEAD -- . <control-output exclusions>`
4. `git ls-files --others --exclude-standard -z -- . <control-output exclusions>`

Hash raw stdout bytes. Never hash stderr, warnings, timestamps, absolute paths, ambient CWD, PIDs, or hostnames.

Untracked paths are slash-normalized and sorted. Regular files are hashed from exact bytes. Symlinks are hashed from their exact link-target representation. Unsupported or unreadable objects produce `IDENTITY_FAILED`; they are never silently omitted.

The final digest is SHA-256 over stable canonical UTF-8 JSON containing algorithm, workspace-relative scope, HEAD, component hashes, the explicit exclusions, and the sorted untracked manifest.

## Lifecycle-output exclusions
`yaaw-worktree-v2` excludes only YAAW files whose normal lifecycle write would otherwise invalidate the repository basis that the file itself records:

- `.yaaw-core/runtime/**` — replaceable observation/handoff/intent/failure caches;
- `.yaaw-core/project/state.json` — Orchestrator lifecycle ledger;
- `.yaaw-core/project/evidence/**` — immutable verification attestations;
- `.yaaw-core/project/reviews/**` — immutable acceptance attestations.

This prevents circular freshness: writing an observation, handoff, state transition, evidence record, or review cannot by itself make the implementation repository identity stale. These artifacts remain governed by their own schemas, revisions, immutability rules, transition sequence, and handoff references.

The exclusion deliberately does **not** cover product, engineering, research, specs, tickets, project rules, `.yaaw-core/install/**`, package-managed `.yaaw-core/system/**`, application files, `.codex/`, `.agents/`, `.claude/`, `.gemini/`, `.cline/`, or other provider/project paths. Changes to those continue to change repository identity.

When the Git top-level is an ancestor, unrelated sibling changes remain outside identity because all commands are scoped to the active workspace.
