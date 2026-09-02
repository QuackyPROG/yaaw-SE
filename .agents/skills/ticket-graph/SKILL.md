---
name: ticket-graph
description: Convert understood work into discovery, decision and tracer-bullet delivery tickets with genuine blocking edges and an executable ready frontier.
---

# Ticket Graph

## Ticket selection

Use:

- DISCOVERY when an answer depends on evidence.
- DECISION when multiple valid outcomes require a choice/approval.
- DELIVERY when behavior and boundaries are known enough to implement now.

## Delivery slicing

Prefer vertical tracer bullets: a narrow complete path through whatever layers are required to make one behavior independently verifiable. Each delivery ticket should normally fit one fresh implementation context.

Do not create horizontal tickets such as "database", "backend", "frontend", "tests" unless the work is genuinely an infrastructure/refactor primitive that cannot be delivered vertically.

## Dependencies

Every ticket declares `Blocked by`. A blocker is real only when it prevents safe start or acceptance. Avoid dependency theater.

After tickets exist, compute the ready frontier: open tickets with all blockers DONE, current evidence/decisions, known owner, and bounded acceptance.

## Wide refactors

When a broad mechanical change cannot keep the codebase green as independent vertical slices:

1. EXPAND — add the new form compatibly;
2. MIGRATE — move callers in blast-radius-sized batches;
3. CONTRACT — remove the old form only after all migrations;
4. if batches cannot be independently green, use isolated integration and one final integrate/verify ticket.

## Review

Before publishing/committing a graph, check: each ticket has one primary outcome; acceptance is observable; blockers are necessary; ready work is actually executable; no ticket silently spans unrelated owners; unresolved fog has not been turned into fictional precision.
