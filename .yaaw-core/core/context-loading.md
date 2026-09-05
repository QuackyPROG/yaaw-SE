# Context loading

Load the smallest durable context needed for the current judgment:

```text
role contract
+ workflow contract
+ active artifact and revision
+ directly referenced decisions
+ relevant product constraints
+ relevant project rules
+ relevant repository files/diff
+ selected expertise
+ prior review finding when repairing
+ current handoff/repository identity when dispatched
```

Do not automatically load every PRD revision, ticket, review, expertise module, or the full repository.

## Handoff freshness
A handoff names exact artifact paths, revisions, selected expertise, expected output, and the repository identity observed when it was created. Before executing it, verify those bases still match current reality. If they do not, discard the stale handoff and re-enter orchestration inspection.

Runtime handoffs and observed-state snapshots live under `.yaaw/runtime/`; they are coordination caches, not semantic sources of truth.
