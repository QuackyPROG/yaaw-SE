# Context loading

Load the smallest durable context needed for the current judgment. The exact handoff is the role's task contract; optional learned project memory only accelerates understanding around that contract.

## Authoritative-first invariant

Routing and handoff construction are already complete before target-role memory enrichment begins. Inside the target role, authoritative YAAW context is consumed before learned memory is used.

If the host injects memory at session start, quarantine it as `LEARNED MEMORY — ADVISORY / UNVERIFIED` until the mandatory handoff/artifact/repository inputs are loaded. A role with `memory_mode: disabled` ignores injected learned memory for semantic work.

## Startup order

1. Read `.yaaw/runtime/handoff.json` first and validate its repository/revision basis.
2. Load the role contract, workflow contract, active artifact/revision, directly referenced decisions, relevant product/rules, selected expertise, and only repository/evidence paths admitted by the handoff.
3. Apply the handoff `context_policy`. When memory is enabled for the role and the harness already exposes a provider, use `core/project-memory.md` at the prescribed phase and retrieve only task-relevant context.
4. Keep every memory result in a visibly separate advisory/provenance envelope. Verify remembered claims against the exact current files or evidence that matter to the judgment or edit.
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

THEN, when policy permits and a provider already exists:

+ small relevant LEARNED MEMORY — ADVISORY / UNVERIFIED
```

Never replace a required artifact/repository/evidence read with memory retrieval. Memory does not expand `reads`, `writes`, `forbidden_writes`, ticket scope, or authority.

Do not automatically load every PRD revision, engineering decision, ticket, review, expertise module, memory page, git-history segment, or the full repository.

## Memory budget and progressive disclosure

`context_policy.memory_target_tokens` is a best-effort target for memory material placed into the role context, not permission to consume that much.

Use the retrieval ladder in `core/project-memory.md`:

1. focused knowledge search;
2. one relevant page read only when needed;
3. deep history/reflection only when `deep_history_allowed` is true and shallow retrieval is insufficient.

If the provider cannot enforce token limits directly, keep the request narrowly scoped and stop retrieving once the question is answered.

## Failure semantics

Provider absence, disablement, empty results, unavailability, and search/read/reflect timeouts degrade to:

```text
exact handoff
+ canonical durable artifacts
+ current repository/evidence
```

They do not create `BLOCKED`, change routing, or satisfy/violate a lifecycle prerequisite by themselves.

## Handoff freshness

A handoff names exact artifact paths, revisions, selected expertise, context policy, expected output, and the repository identity observed when it was created. Before executing it, verify those bases still match current reality. If they do not, discard the stale handoff and re-enter orchestration inspection.

Runtime handoffs and observed-state snapshots live under `.yaaw/runtime/`; they are coordination caches, not semantic sources of truth. Learned project memory is also not a semantic source of truth.
