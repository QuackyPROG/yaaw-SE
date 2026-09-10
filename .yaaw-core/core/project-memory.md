# Project memory and learned context

YAAW may use an optional learned project-memory provider to give disposable roles relevant historical context without making them rediscover the repository from scratch. Hindsight is the reference provider, but the workflow contract is provider-neutral.

Project memory is an accelerator, not an authority layer. A YAAW workflow must remain correct when no memory provider exists, when the provider is disabled, unavailable, times out, or returns stale/wrong information.

## Two kinds of continuity

YAAW deliberately separates:

```text
DURABLE CONTRACTUAL MEMORY
current human/product authority
+ canonical YAAW artifacts
+ repository/evidence reality

LEARNED EXPERIENTIAL MEMORY
past conversations
+ historical rationale
+ prior implementations/failures
+ conventions and recurring defects
+ similar tasks
+ in-flight initiative context
```

Agents are disposable. Artifacts are durable. Learned experience may also persist. Only authoritative artifacts/evidence determine workflow truth.

## Authority boundary

Learned memory is derived, heuristic, and potentially stale. It may influence investigation and reasoning, but it never independently establishes:

- product intent or accepted product revisions;
- current engineering decisions, specs, or ticket contracts;
- ticket lifecycle state or orchestration routing;
- implementation completion or repository/evidence reality;
- review acceptance or `PASS` / `REPAIR` / `REPLAN` / `BLOCKED` classification.

When sources disagree, use the current authority for the question being answered. Current human instructions and canonical YAAW artifacts outrank remembered summaries; current repository/evidence outranks memory for implementation reality. Memory never overrides `.yaaw-core/**`.

## Fresh-context invariant

Memory is optional. Every role must still be able to reconstruct and execute its workflow from the exact handoff, canonical durable artifacts, and current repository/evidence.

The following conditions are normal degraded modes, not YAAW blockers by themselves:

```text
provider absent
provider disabled
provider unavailable
memory search/read/reflect timeout
empty retrieval
stale or contradictory retrieval
```

Fall back to the authoritative handoff + durable artifacts + repository/evidence. Provider failure cannot create a lifecycle transition, `BLOCKED`, or a missing prerequisite unless the authoritative YAAW inputs themselves are unavailable.

## Authoritative-first context rule

The target role must consume authoritative context before using learned memory.

If a host automatically injects memory at session start, quarantine it as advisory background until the exact handoff and mandatory authoritative references have been loaded and validated. For roles whose context policy disables memory, ignore the injected material for semantic work.

Learned memory never replaces a required artifact/repository/evidence read and never expands the handoff read/write authority.

## Retrieval ladder

After reading the exact handoff and mandatory authoritative references, use the smallest memory operation that can answer the remaining context question:

1. **Search curated project knowledge first.** Retrieve only task-relevant snippets.
2. **Read one relevant knowledge page** when snippets are too shallow.
3. **Use deep reflection/history only on demand** for rationale, previous failed approaches, exact historical values, or cross-session reasoning that the pages do not contain.
4. **Expand repository exploration only when current verification or unresolved gaps require it.** Memory reduces rediscovery; it never replaces checking the current files that will influence a decision or edit.

Do not dump the whole memory bank into a role context. Honor the per-role target budget from `registries/context-policy.json` / the handoff `context_policy` and prefer one focused retrieval over broad historical context.

## Provenance envelope

Any learned-memory material deliberately added to a role context must remain visibly separated from authoritative context and carry enough provenance to identify its origin.

Use an equivalent of:

```text
LEARNED MEMORY — ADVISORY / UNVERIFIED
provider: <provider-name>
operation: <search|read|reflect|host-injected>
source: <page-id/title, query, or provider reference>
content: <focused remembered material>
```

`UNVERIFIED` remains the default until the owning role checks a material claim against current authority/repository reality. Verification lets the role use the fact in its reasoning; it does not turn the memory item itself into a canonical artifact.

## Provider contract

A provider is active only when:

1. the selected role's `context_policy` enables memory; and
2. the executing harness already exposes the provider capability.

YAAW never installs, configures, authenticates, or silently enables an external memory provider. Provider setup is user/machine configuration outside the repository.

Hindsight is the first reference adapter and is defined in `integrations/hindsight.md`. Other providers may implement the same advisory semantics without changing routing/lifecycle behavior.

## Role policy

- **PRD:** automatic learned-memory use is disabled. Product intent comes from current human authority and `docs/product/product.md`. Host-injected learned engineering/project memory must be ignored for product-definition semantics.
- **Planner:** memory may be used after authoritative planning inputs and before broad repository discovery. Use it for component maps, conventions, historical decisions, prior initiatives, rejected approaches, failed migrations, and rationale; verify material claims before promoting anything into engineering truth.
- **Implementer:** memory may be used after the accepted ticket/spec are understood and before broad code archaeology. Use it for local conventions, previous implementations, known traps, recurring defects, historical test failures, and rationale; never use it to expand ticket scope or override the accepted contract.
- **Reviewer:** memory is secondary and may be consulted only after the primary acceptance/evidence inspection. It can suggest regressions/failure modes to inspect, but can never supply evidence or manufacture `PASS`.
- **Orchestrator:** semantic project memory is disabled for routing/reconciliation. Orchestrator uses current state, artifacts, repository identity, evidence, reviews, registries, and transition rules only.

## Promotion rule

A remembered fact becomes authoritative only after the owning semantic role verifies it against current authority/reality and writes the resulting decision/fact into the canonical artifact it owns. Conversation or memory must never be the only location of an accepted decision.

Planner must not turn a remembered claim directly into an `ENG-*` decision. Implementer must not treat remembered architecture as permission to change scope. Reviewer must not cite memory as acceptance evidence.

## Corrections and staleness

If learned memory conflicts with current authoritative YAAW artifacts or repository/evidence:

```text
do not change YAAW to match memory
→ verify the conflict
→ follow current authoritative evidence
→ optionally correct the memory provider
```

When the provider supports corrections, record:

1. what memory claimed;
2. what has been verified as currently true;
3. which current artifact/file/commit/evidence proves it.

Correcting memory never mutates YAAW lifecycle state and never silently rewrites another role's artifact. A provider correction is an auxiliary learned-memory write, not a canonical YAAW output.

## Initiative synchronization

An in-flight initiative is an optional learned-memory convenience, never the project tracker.

The preferred synchronization boundary is after an accepted spec has been decomposed into validated ticket contracts and before broad implementation proceeds. At that point Planner may best-effort capture/update an initiative containing:

```text
feature/frontier
SPEC id + revision
important ENG decision ids
goal
scope/non-goals
current ticket frontier
```

If replanning materially changes goal, scope, or rationale, update the existing provider initiative when it can be identified rather than creating an unrelated duplicate. Provider identifiers are never required by canonical artifacts. If a provider correlation cache is useful, it may live only in optional reconstructable `.yaaw/runtime/` metadata and must never become a lifecycle prerequisite.

Failure to capture/update an initiative is non-blocking and cannot change ticket admission, routing, or acceptance.

## Auxiliary provider writes

Provider correction/initiative writes are outside the canonical artifact graph. They:

- never satisfy the handoff's required durable output;
- never substitute for a permitted canonical write;
- never grant a role new YAAW file authority;
- are best-effort and non-blocking;
- must not include secrets or live YAAW control state.

Automatic provider session write-back, when configured by the user/harness, is also non-authoritative.

## Do not memorize live control state

Do not deliberately ingest or summarize live instruction/control files into project memory:

```text
AGENTS.md
skills/**
.yaaw-core/**
.yaaw/runtime/**
.yaaw/state.json
```

Also exclude secrets, credentials, `.env` contents, private keys, tokens, and other sensitive runtime configuration. These are live controls or sensitive data, not historical project knowledge. Historical commits may mention YAAW artifacts, but any remembered copy is advisory and the current file always wins.
