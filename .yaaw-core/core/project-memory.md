# Project memory and context acceleration

YAAW may use an optional project-memory provider to give disposable roles relevant historical context without making them rediscover the repository from scratch. Hindsight is the reference provider, but the workflow contract is provider-neutral.

Project memory is an accelerator, not an authority layer. A YAAW workflow must remain correct when no memory provider exists.

## Authority boundary

Memory is derived, heuristic, and potentially stale. It may explain history, conventions, prior attempts, or rationale, but it never decides:

- product intent or accepted product revisions;
- current engineering decisions, specs, or ticket contracts;
- ticket lifecycle state or orchestration routing;
- repository/evidence reality;
- review acceptance or `PASS` / `REPAIR` / `REPLAN` / `BLOCKED` classification.

When sources disagree, use the current authority for the question being answered. Current human instructions and canonical YAAW artifacts outrank remembered summaries; current repository/evidence outranks memory for implementation reality. Memory never overrides `.yaaw-core/**`.

## Fresh-context invariant

Memory is optional. Every role must still be able to reconstruct and execute its workflow from the exact handoff, canonical durable artifacts, and current repository/evidence. Missing or failed memory retrieval is not a blocker by itself.

## Retrieval ladder

After reading the exact handoff and mandatory authoritative references, use the smallest memory operation that can answer the remaining context question:

1. **Search curated project knowledge first.** Retrieve only task-relevant snippets.
2. **Read one relevant knowledge page** when snippets are too shallow.
3. **Use deep reflection/history only on demand** for rationale, previous failed approaches, exact historical values, or cross-session reasoning that the pages do not contain.
4. **Expand repository exploration only when current verification or unresolved gaps require it.** Memory reduces rediscovery; it never replaces checking the current files that will influence a decision or edit.

Do not dump the whole memory bank into a role context. Honor the per-role target budget from `registries/context-policy.json` / the handoff `context_policy` and prefer one focused retrieval over broad historical context.

## Hindsight reference mapping

When Hindsight tools are available, the provider operations map naturally to:

- search project knowledge -> `hindsight_search_knowledge_pages`;
- read a curated page -> `hindsight_read_knowledge_page` (list pages first only when needed);
- deep historical reasoning -> `hindsight_reflect`;
- capture a substantial approved initiative -> `hindsight_capture_initiative`;
- record a verified correction or durable external finding -> `hindsight_ingest_document`.

Tool availability alone is insufficient. Roles follow the explicit trigger phases in `registries/context-policy.json` and their role/workflow contracts.

## Role policy

- **PRD:** light memory use before re-asking product questions. Past discussion is a lead, not accepted intent; current human answers and `product.md` decide product truth.
- **Planner:** memory-first before broad repository discovery. Use it for component maps, conventions, historical decisions, prior initiatives, and rejected approaches, then verify current reality before promoting anything into engineering truth.
- **Implementer:** memory-first before broad code archaeology. Use it for local conventions, component rationale, known traps, and previous fixes; never use it to invent or change the ticket/spec contract.
- **Reviewer:** memory is secondary and may be consulted only after the primary acceptance/evidence inspection. It can explain ambiguity but can never supply evidence for `PASS`.
- **Orchestrator:** semantic project memory is disabled for routing/reconciliation. Orchestrator uses current state, artifacts, repository identity, evidence, reviews, registries, and transition rules only.

## Promotion rule

A remembered fact becomes authoritative only after the owning semantic role verifies it against current authority/reality and writes it into the canonical artifact it owns. Conversation or memory must never be the only location of an accepted decision.

## Corrections and staleness

If a memory result is verified wrong or outdated:

1. ignore it for the current judgment;
2. continue from current authoritative artifacts/evidence;
3. when the provider supports corrections, record a concise correction with the stale claim, current truth, and verified evidence.

Correcting memory never mutates YAAW lifecycle state and never silently rewrites another role's artifact.

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
