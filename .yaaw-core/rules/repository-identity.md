# Repository identity

Acceptance and recovery must distinguish one working state from another, including uncommitted work.

Record:
- `head_commit`: current `HEAD` commit SHA;
- `dirty`: whether tracked/untracked work differs from HEAD;
- `worktree_digest`: SHA-256 over a deterministic snapshot of status plus tracked/staged diffs and untracked file content where accessible.

Recommended digest inputs:
1. `git status --porcelain=v1 -z`;
2. `git diff --binary HEAD`;
3. `git diff --cached --binary HEAD`;
4. sorted untracked paths and their byte hashes.

If the environment cannot produce a trustworthy worktree digest for dirty work, review/recovery must say so and may return `BLOCKED` rather than pretending the state is uniquely identified.
