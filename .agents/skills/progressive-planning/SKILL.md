---
name: progressive-planning
description: Plan L2-L4 work at the minimum useful resolution, using specs, initiative maps, decision/discovery tickets, a ready frontier and deliberate fog rather than a frozen giant backlog.
---

# Progressive Planning

## Choose scale

- L2: behavior is understandable; create a spec/decision set and tracer-bullet delivery graph.
- L3: destination is known but the path depends on sequential discoveries/decisions; create an initiative map and current frontier only.
- L4: major architecture/migration/trust/destructive risk; add explicit compatibility/rollback/integration strategy and high-assurance gates.

## Planning sequence

1. Name the **destination**: what observable state means the initiative has reached its intended boundary.
2. Record known constraints and accepted decisions without upgrading inference to approval.
3. Identify precise questions answerable now. Express fact questions as DISCOVERY and choice questions as DECISION.
4. Put still-imprecise but in-scope future concerns in `Not yet specified`/fog. Do not pre-slice fog into guessed tickets.
5. Add blocking edges only where a ticket genuinely cannot start/finish without another.
6. Identify the ready frontier.
7. Once enough decisions/evidence exist, create DELIVERY tracer bullets sized for fresh contexts.
8. Define QA/isolation/integration requirements from risk.
9. Stop planning when the current executable frontier is safe and clear. Future sessions continue from durable artifacts.

## Large initiatives

Resolve frontier decisions/evidence progressively. Each resolution may surface new precise tickets, retire fog, or invalidate unresolved future work. Use `plan-delta` rather than rebuilding the whole plan from scratch.

## Guardrails

Do not implement during planning unless the contract explicitly calls for a throwaway prototype/probe. Do not invent detailed file paths in long-lived specs unless the path itself is an architectural contract. Prefer stable module/interface language.
