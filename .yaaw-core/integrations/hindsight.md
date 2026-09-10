# Hindsight learned-memory adapter

Hindsight is YAAW's first reference provider for optional learned experiential memory. This adapter maps Hindsight capabilities into the provider-neutral rules in `core/project-memory.md`.

It is not a workflow, role, router, source of lifecycle truth, or required dependency.

## Activation

Use this adapter only when both are true:

1. the dispatched role's handoff `context_policy.memory_mode` is not `disabled`; and
2. the current execution harness already exposes the relevant Hindsight capabilities.

Never install Hindsight from a YAAW workflow. Never enable it automatically. Never write Hindsight credentials, server URLs, tokens, or machine configuration into this repository or a consuming project's canonical YAAW artifacts.

If Hindsight is absent, disabled, unavailable, or times out, continue with the authoritative handoff, canonical artifacts, and repository/evidence.

## Capability mapping

Use the smallest capability that answers the remaining historical-context question:

```text
search project knowledge
→ hindsight_search_knowledge_pages

read one relevant knowledge page
→ hindsight_read_knowledge_page

deep historical/rationale synthesis
→ hindsight_reflect

record a verified correction or durable external finding
→ hindsight_ingest_document

capture/update an active feature initiative
→ hindsight_capture_initiative
```

List pages only when a page id cannot be discovered by focused search. Do not reproduce Hindsight's retrieval/consolidation engine inside YAAW.

## Context ingestion

Authoritative YAAW context is consumed first. Hindsight output is then added only as a separate learned-memory envelope:

```text
LEARNED MEMORY — ADVISORY / UNVERIFIED
provider: hindsight
operation: <search|read|reflect|host-injected>
source: <knowledge-page-id/title or query>
content: <focused result>
```

If the host injected Hindsight context at session start, treat it as quarantined advisory material until the handoff and current authoritative inputs are validated. When YAAW context policy disables memory, ignore that injected context for semantic decisions.

Hindsight output never expands `reads`, `writes`, `forbidden_writes`, ticket scope, or role authority.

## Retrieval guidance

For Planner and Implementer, prefer:

```text
focused knowledge-page search
→ one page read when needed
→ deep reflect only for unresolved rationale/history
→ current repository verification
```

For Reviewer, first complete the primary current acceptance/evidence inspection. Hindsight may be consulted only afterward as a source of inspection leads or historical explanation.

Do not use Hindsight automatically for PRD product-definition semantics or Orchestrator routing/reconciliation.

## Conflict correction

When a Hindsight result is verified stale or wrong, do not alter YAAW to match it.

When correction is useful, call `hindsight_ingest_document` with a concise correction:

```text
title: Correction: <topic>

what memory claimed:
<stale claim>

verified current truth:
<current fact>

evidence:
<canonical artifact/file/commit/evidence identity>
```

A successful correction changes learned memory only. It never changes YAAW state, accepted engineering decisions, source code, or review outcome.

## Initiative synchronization

After `planning.create-tickets` has produced validated ticket contracts for a current accepted spec, Planner may best-effort capture an in-flight initiative before broad implementation.

The initiative summary should identify:

```text
frontier / feature
SPEC id + revision
important ENG decision ids
goal
scope and non-goals
current TASK ids / implementation frontier
```

Use a stable spec/frontier identity in the title/summary. Before creating a new initiative, search project knowledge for that stable identity. If an existing initiative page is found, update it with `hindsight_capture_initiative(..., relates_to_page_id=<existing-page-id>)`. Do not create a duplicate initiative merely because planning ran again.

After material replanning, repeat the search and update the same initiative to represent current goal/scope/rationale. Trivial implementation corrections do not require an initiative update.

If capture/update fails or no provider is available, continue normally. The initiative is never an authoritative tracker and cannot affect ticket admission, routing, implementation, review, or completion.

## Privacy and portability

Hindsight setup is explicit user/machine configuration. YAAW project initialization must not install, enable, seed, or authenticate Hindsight.

Do not deliberately ingest:

```text
AGENTS.md
skills/**
.yaaw-core/**
.yaaw/runtime/**
.yaaw/state.json
secrets / credentials / tokens / private keys / .env contents
```

A checkout without Hindsight must behave exactly like a checkout with Hindsight removed or disabled, except for the absence of advisory learned context.
