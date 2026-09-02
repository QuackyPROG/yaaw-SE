# Git and Delivery

Git is evidence and recovery infrastructure, not merely storage.

Before implementation inspect branch/status/relevant history. Before acceptance inspect the actual diff and compare the expected change surface with what actually changed.

## Commit unit

A commit represents one coherent **verified outcome**. It should be independently understandable, reviewable, and reasonably revertible.

Prefer ticket-aligned commits when a DELIVERY ticket maps cleanly to one outcome. Split truly independent fixes; combine edits that are inseparable to one behavior. Do not commit every trivial mutation and do not batch unrelated tickets into one opaque mega-commit.

Recommended message shape:

```text
fix(scope): concise outcome [DEL-07]

- materially changed behavior
- important implementation detail or preserved invariant

Verified:
- exact command/check
```

The commit message is an index, not a second ticket. Keep deep reasoning, discovery history, and QA evidence in their canonical artifacts.

One worktree has one active writer. Parallel writers require isolated worktrees/branches and explicit integration ownership.

Never force a shared branch merely to escape conflicts, hide failing checks, infer required approval from a green CI run, or claim deployed/provider state without observing it. The consuming domain pack owns the exact promotion policy.
