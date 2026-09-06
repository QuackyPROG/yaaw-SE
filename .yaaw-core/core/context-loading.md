# Context loading

Load the smallest durable context needed for the current judgment. The exact handoff is the role's task contract; optional project memory only accelerates understanding around that contract.

## Startup order

1. Read `.yaaw/runtime/handoff.json` first and validate its repository/revision basis.
2. Load the role contract, workflow contract, active artifact/revision, directly referenced decisions, relevant product/rules, selected expertise, and only repository/evidence paths admitted by the handoff.
3. Apply the handoff `context_policy`. When memory is enabled for the role, use `core/project-memory.md` at the prescribed phase and retrieve only task-relevant context.
4. Verify remembered/current claims against the exact current files or evidence that matter to the judgment or edit.
5. Expand repository exploration only when the authoritative references, targeted verification, and focused memory retrieval still leave a material gap.

The normal context is therefore:

```text
role contract
+ workflow contract
+ exact handoff
+ active artifact and revision
+ directly referenced decisions
+ relevant product constraints
+ relevant project rules
+ admitted repository files/diff/evidence
+ selected expertise
+ prior review finding when repairing
+ small relevant project-memory retrieval when policy allows
```

Do not automatically load every PRD revision, engineering decision, ticket, review, expertise module, memory page, git-history segment, or the full repository.

## Memory budget

`context_policy.memory_target_tokens` is a best-effort target for memory material placed into the role context, not permission to consume that much. Prefer search snippets; read a full knowledge page only when necessary; use deep history only when `deep_history_allowed` is true and the shallow path is insufficient.

If the provider cannot enforce token limits directly, keep the request narrowly scoped and stop retrieving once the question is answered.

## Handoff freshness

A handoff names exact artifact paths, revisions, selected expertise, context policy, expected output, and the repository identity observed when it was created. Before executing it, verify those bases still match current reality. If they do not, discard the stale handoff and re-enter orchestration inspection.

Runtime handoffs and observed-state snapshots live under `.yaaw/runtime/`; they are coordination caches, not semantic sources of truth. Project memory is also not a semantic source of truth.
