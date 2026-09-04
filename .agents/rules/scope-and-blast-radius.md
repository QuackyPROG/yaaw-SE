# Scope and Blast Radius

Every implementation route declares expected owner, allowed write globs, forbidden write globs, and verification. L0/L1 should use `scripts/verify_task_scope.py` when practical; higher-assurance routes should enforce the same contract through controller/runtime boundaries where available.

Scope validation covers committed, staged, unstaged and untracked paths. Rename/copy operations validate **both source and destination endpoints**; a move cannot launder an out-of-scope or forbidden source into an allowed destination. Deletes remain attributable to their removed path. Filesystem/tool sandboxing may strengthen this post-hoc Git evidence but must not weaken it.

Unexpected files are evidence that the route assumptions may be wrong. Do not normalize them after the fact by widening the contract yourself.

Promote/replan when actual work crosses owners/subsystems, shared interfaces, architecture/migration, trust/security/provider boundaries, dependency policy, CI/release policy, or destructive/reversibility boundaries.

Read scope may be wider than write scope when needed to understand an interface. Keep both bounded to the question.
