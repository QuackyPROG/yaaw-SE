# Scope and Blast Radius

Every implementation route declares expected owner, allowed write globs, forbidden write globs, and verification. L0/L1 should use `scripts/verify_task_scope.py` when practical.

Unexpected files are evidence that the route assumptions may be wrong. Do not normalize them after the fact by widening the contract yourself.

Promote/replan when actual work crosses owners/subsystems, shared interfaces, architecture/migration, trust/security/provider boundaries, dependency policy, CI/release policy, or destructive/reversibility boundaries.

Read scope may be wider than write scope when needed to understand an interface. Keep both bounded to the question.
