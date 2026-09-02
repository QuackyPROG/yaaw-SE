# Git and Delivery

Git is evidence and recovery infrastructure, not merely storage.

Before implementation inspect branch/status/relevant history. Before acceptance inspect the actual diff. Keep commits coherent and attributable to one bounded outcome.

One worktree has one active writer. Parallel writers require isolated worktrees/branches and explicit integration ownership.

Never force a shared branch merely to escape conflicts, hide failing checks, infer required approval from a green CI run, or claim deployed/provider state without observing it. The consuming domain pack owns the exact promotion policy.
