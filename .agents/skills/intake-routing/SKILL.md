---
name: intake-routing
description: Classify an engineering request by work shape, ownership, uncertainty, blast radius and minimum safe complexity level before execution.
---

# Intake Routing

## Goal

Turn raw natural-language work into a bounded route without forcing ceremony onto simple tasks or pretending ambiguous work is ready to code.

## Process

1. Read `AGENTS.md`, `docs/index.md`, current work item if any, `.agents/router.json`, Git state, and the smallest likely target context.
2. Classify work shape: QUESTION, BUG, FEATURE, REFACTOR, DOCUMENTATION, ARCHITECTURE, MIGRATION, EXTERNAL_INTEGRATION, SECURITY_TRUST_BOUNDARY, RELEASE, AGENT_MAINTENANCE, or UNKNOWN.
3. Resolve likely owner using `.agents/ownership.json`. If no credible owner is registered, use `UNKNOWN_OWNER` and discover before mutation.
4. Estimate uncertainty, blast radius, reversibility, interface/dependency impact, trust/provider impact, and decision load.
5. Select the lowest safe L0–L4 route. Apply router promotion triggers.
6. State goal, acceptance signal, allowed/forbidden scope, verification seam, missing evidence/decision, required roles/skills, and QA disposition.
7. If the route is not yet executable, create/route the minimum DISCOVERY or DECISION work instead of asking broad questions.

## Output

```text
Work shape:
Level:
Owner:
Goal:
Acceptance:
Known evidence:
Unknowns:
Allowed scope:
Forbidden scope:
Verification:
Required roles/skills:
QA disposition:
Durable artifact required:
Next action:
```

Investigate before asking the user. Ask at most one focused question when repository/external evidence cannot resolve a material authority choice.
