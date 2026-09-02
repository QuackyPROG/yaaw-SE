---
name: intake-routing
description: Classify an engineering request by work shape, ownership, uncertainty, blast radius and minimum safe complexity level before execution.
---

# Intake Routing

## Artifact contract

Canonical machine contract: `.agents/artifacts.json` -> `contracts.skills.intake-routing`.

- Read: `AGENTS.md`, `docs/index.md`, current work item, `.agents/router.json`, `.agents/ownership.json`, Git state, smallest likely target context.
- Produce: `TASK_PROFILE` only.
- Durable destination, when one is required, is the registered current-ticket route/intake location; otherwise the task profile may remain ephemeral.
- Do not create specs, ticket graphs, product code, or ad-hoc routing files from this skill.

## Goal

Turn raw natural-language work into a bounded route without forcing ceremony onto simple tasks or pretending ambiguous work is ready to code.

## Process

1. Read the routing sources above.
2. Classify work shape: QUESTION, BUG, FEATURE, REFACTOR, DOCUMENTATION, ARCHITECTURE, MIGRATION, EXTERNAL_INTEGRATION, SECURITY_TRUST_BOUNDARY, RELEASE, AGENT_MAINTENANCE, or UNKNOWN.
3. Resolve likely owner using `.agents/ownership.json`; use `UNKNOWN_OWNER` when none is credible.
4. Estimate uncertainty, blast radius, reversibility, interface/dependency impact, trust/provider impact, and decision load.
5. Select the lowest safe L0-L4 route and apply promotion triggers.
6. State goal, acceptance, allowed/forbidden scope, verification seam, missing evidence/decision, required roles/skills, QA disposition, and artifact outputs.
7. If not executable, route minimum DISCOVERY or DECISION work instead of asking broad questions.

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

Investigate before asking the user. Ask at most one focused question when evidence cannot resolve a material authority choice.
