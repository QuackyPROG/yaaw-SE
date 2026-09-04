---
name: progressive-planning
description: Use for L2-L4 work to turn accepted intent and evidence into a bounded READY frontier without overplanning.
---

# progressive-planning

## Purpose

Plan L2-L4 work only as far as current evidence supports, producing the smallest safe current frontier.

## Artifact contract

Resolve `.agents/artifacts.json` and `.agents/authority.json`. Produces/updates SPEC, INITIATIVE_MAP and unresolved DISCOVERY/DECISION/DELIVERY tickets. Accepted PRD semantics are read-only.

## Algorithm

1. State destination, accepted intent, non-goals, invariants and constraints.
2. Separate known facts, unresolved factual questions, delegated decisions and unknowable future territory.
3. Create DISCOVERY/DECISION prerequisites only when they materially unblock delivery.
4. Slice DELIVERY as vertical tracer bullets that fit one fresh implementation context.
5. Record blockers by stable IDs; leave unready future work as fog rather than fictional tickets.
6. Let the deterministic graph engine detect cycles/missing blockers and calculate the READY frontier.
7. For wide mechanical changes use expand -> migrate bounded batches -> contract.
8. Stop planning when a safe frontier exists; do not decompose the entire initiative for aesthetics.
