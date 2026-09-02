---
name: progressive-planning
description: Plan L2-L4 work at the minimum useful resolution, using accepted product intent when present, specs, initiative maps, decision/discovery tickets, a ready frontier and deliberate fog rather than a frozen giant backlog.
---

# Progressive Planning

## Artifact contract

Canonical machine contract: `.agents/artifacts.json` -> `contracts.skills.progressive-planning`.

- Read: task profile, relevant accepted PRD when one exists, accepted ADRs/architecture, current specs/maps/tickets, relevant evidence, smallest relevant implementation context.
- Produce: `SPEC`, `INITIATIVE_MAP`, `DISCOVERY_TICKET`, `DECISION_TICKET`, `DELIVERY_TICKET`.
- Resolve each canonical locator/template from `.agents/artifacts.json` before creating it.
- Do not invent folders for planning artifacts and do not turn fog into fictional tickets merely to appear complete.
- Do not mutate PRD semantics; translate intent into the minimum current engineering structure.

## Choose scale

- L2: behavior is understandable; create a spec/decision set and tracer-bullet delivery graph.
- L3: destination is known but path depends on sequential discoveries/decisions; create an initiative map and current frontier only.
- L4: major architecture/migration/trust/destructive risk; add explicit compatibility/rollback/integration strategy and high-assurance gates.

## Planning sequence

1. Name the destination from explicit human intent and any relevant accepted PRD.
2. Record product invariants, known constraints and accepted decisions without upgrading inference to approval.
3. Express fact questions as DISCOVERY and choice questions as DECISION.
4. Put still-imprecise but in-scope concerns in `Not yet specified`/fog.
5. Add only genuine blocking edges.
6. Identify the ready frontier.
7. Once enough decisions/evidence exist, create DELIVERY tracer bullets sized for fresh contexts with preservation invariants and expected change surface.
8. Define QA/isolation/integration requirements from risk.
9. Stop when the current executable frontier is safe and clear.

## Large initiatives

Each frontier resolution may surface new precise tickets, retire fog, or invalidate unresolved future work. Use `plan-delta` rather than rebuilding the whole plan from scratch.

If a discovery implies the desired product outcome itself must change, stop at human product authority; do not disguise a PRD change as PLAN_DELTA.

## Guardrails

Do not implement during planning unless explicitly contracted for a throwaway prototype/probe. Prefer stable module/interface language over brittle file-path detail in long-lived specs. Never require a PRD merely because work is L2-L4; PRD creation remains manual.
