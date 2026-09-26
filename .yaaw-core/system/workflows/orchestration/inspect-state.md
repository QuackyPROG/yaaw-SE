# Inspect state

## Purpose
Create a non-mutating observed-reality snapshot using the same deterministic runtime implementation used by normal orchestration.

## Procedure
1. Resolve `WORKSPACE_ROOT` using `.yaaw-core/system/core/execution-context.md`.
2. Execute:

```text
node .yaaw-core/system/tools/orchestration-runtime.mjs --workspace <WORKSPACE_ROOT> --inspect-only
```

3. Consume `.yaaw-core/runtime/observed-state.json` and the typed `INSPECTED`/framework-stop result.
4. Do not independently invoke Git, calculate `worktree_digest`, discover artifact locations, or serialize a second observation.

## Output
Observed-state snapshot only; no semantic/ticket-state mutation and no executable handoff construction in `--inspect-only` mode.
