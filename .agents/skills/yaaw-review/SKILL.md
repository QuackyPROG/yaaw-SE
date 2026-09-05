---
name: yaaw-review
description: Fresh independent review of an implementation, returning PASS, REPAIR, REPLAN, or BLOCKED with evidence.
---

# yaaw-review

Load `_yaaw-core/workflows/review/workflow.md` and relevant modules. Review the actual diff and observed evidence against the ticket, SPEC/PRD constraints, scope, authority, and risk. Classify; do not repair code or redesign the plan in the same context.

## Artifact contract

Canonical machine contract: `.agents/artifacts.json` -> `contracts.skills.yaaw-review`.

Resolve `.agents/artifacts.json` and `.agents/authority.json`. Review owns findings/acceptance evidence, not implementation or Planner solution tickets.
