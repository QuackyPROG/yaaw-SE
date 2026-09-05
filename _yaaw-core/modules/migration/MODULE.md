# Migration module

Use when persistent state, schemas, stored contracts, backfills, or compatibility windows change.

Planner: classify reversibility, old/new reader-writer compatibility, rollout order, backfill, failure recovery, rollback/cutover, and observability. Do not pretend distant migration details are known before repository/runtime evidence supports them.

Implement: keep the admitted migration slice bounded and preserve compatibility/rollback requirements.

Review: verify forward/backward behavior, data integrity, retry/idempotency, failure recovery, and that destructive/irreversible actions have required authority/evidence.
