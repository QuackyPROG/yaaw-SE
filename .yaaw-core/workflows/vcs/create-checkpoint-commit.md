# Create checkpoint commit

## Purpose

Turn Implementer-owned checkpoint intent into one validated local application commit.

## Inputs

- exact `commit_checkpoint` artifact
- current publishable repository identity
- canonical VCS boundary and policy
- exact admitted application paths

## Process

1. Require project boundary health.
2. Validate the checkpoint base commit against current HEAD.
3. Reject empty, duplicate, protected, missing, or non-admitted paths.
4. Reject YAAW-internal commit-message patterns.
5. Stage only the exact checkpoint paths; blanket staging is forbidden.
6. Reinspect the index and reject any protected or unrelated staged path.
7. Create the local commit without bypassing hooks.
8. Record resulting commit identity in VCS observed state.

## Results

Return `CHECKPOINT_COMMITTED` with the local commit SHA or a typed VCS blocker. Ticket state remains `IN_PROGRESS`.
