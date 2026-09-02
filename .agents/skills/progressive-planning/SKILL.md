---
name: progressive-planning
description: Plan L2-L4 work at the minimum useful resolution, using specs, initiative maps, decision/discovery tickets, a ready frontier and deliberate fog rather than a frozen giant backlog.
---

# Progressive Planning

## Artifact contract

Canonical machine contract: `.agents/artifacts.json` -> `contracts.skills.progressive-planning`.

- Read: task profile, accepted ADRs/architecture, current specs/maps/tickets, relevant evidence, smallest relevant implementation context.
- Produce: `SPEC`, `INITIATIVE_MAP`, `DISCOVERY_TICKET`, `DECISION_TICKET`, `DELIVERY_TICKET`.
- Resolve each canonical locator/template from `.agents/artifacts.json` before creating it.
- Do not invent folders for planning artifacts and do not turn fog into fictional tickets merely to appear complete.

## Choose scale

- L2: behavior is understandable; create a spec/decision set and tracer-bullet delivery graph.
- L3: destination is known but path depends on sequential discoveries/decisions; create an initiative map and current frontier only.
- L4: major architecture/migration/trust/destructive risk; add explicit compatibility/rollback/integration strategy and high-assurance gates.

## Planning sequence

1. Name the destination.
2. Record known constraints and accepted decisions without upgrading inference to approval.
3. Express fact questions as DISCOVERY and choice questions as DECISION.
4. Put still-imprecise but in-scope concerns in `Not yet specified`/fog.
5. Add only genuine blocking edges.
6. Identify the ready frontier.
7. Once enough decisions/evidence exist, create DELIVERY tracer bullets sized for fresh contexts.
8. Define QA/isolation/integration requirements from risk.
9. Stop when the current executable frontier is safe and clear.

## Large initiatives

Each frontier resolution may surface new precise tickets, retire fog, or invalidate unresolved future work. Use `plan-delta` rather than rebuilding the whole plan from scratch.

## Guardrails

Do not implement during planning unless explicitly contracted for a throwaway prototype/probe. Prefer stable module/interface language over brittle file-path detail in long-lived specs.
