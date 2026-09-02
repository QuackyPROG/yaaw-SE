---
name: ticket-graph
description: Convert understood work into discovery, decision and tracer-bullet delivery tickets with genuine blocking edges and an executable ready frontier.
---

# Ticket Graph

## Artifact contract

Canonical machine contract: `.agents/artifacts.json` -> `contracts.skills.ticket-graph`.

- Read: approved spec/map/decisions, current ticket graph, ownership, and current evidence.
- Produce: `DISCOVERY_TICKET`, `DECISION_TICKET`, `DELIVERY_TICKET`, `TICKET_STATE`.
- Use the registered ticket templates and canonical locators; never create a combined shadow backlog when per-ticket files are canonical.
- Graph mutation applies to unresolved work only; completed history is not rewritten for cosmetic consistency.

## Ticket selection

Use DISCOVERY for evidence, DECISION for choice/approval, DELIVERY for bounded implementable behavior.

## Delivery slicing

Prefer vertical tracer bullets: a narrow complete path through every layer required to make one behavior independently verifiable. Each delivery ticket should normally fit one fresh implementation context.

Do not create horizontal "database/backend/frontend/tests" tickets unless the work is genuinely an infrastructure/refactor primitive that cannot land vertically.

## Dependencies

Every ticket declares `Blocked by`. A blocker is real only when it prevents safe start or acceptance. After tickets exist, compute the ready frontier: open tickets with all blockers DONE, current evidence/decisions, known owner, and bounded acceptance.

## Wide refactors

Use EXPAND -> MIGRATE in blast-radius-sized batches -> CONTRACT. If batches cannot be independently green, use isolated integration and one final integrate/verify ticket.

## Review

Check one primary outcome per ticket, observable acceptance, necessary blockers, executable ready work, ownership coherence, and no fictional precision for fog.
