---
name: plan-delta
description: Use when new evidence requires changing unresolved work without rewriting valid completed history.
---

# Plan Delta

## Artifact contract

Canonical machine contract: `.agents/artifacts.json` -> `contracts.skills.plan-delta`.

- Read: trigger evidence, current map/spec/tickets, completed and unresolved graph state, current implementation/diff state.
- Produce: `PLAN_DELTA` plus only the registered unresolved ticket/state changes required by that delta.
- Canonical PLAN_DELTA destination: resolve `PLAN_DELTA.canonical_locator` in `.agents/artifacts.json`; use `docs/templates/plan-delta.md`.
- Update the initiative map/frontier only as required by the recorded delta.
- Never silently widen scope or rewrite completed history.

## Trigger capsule

Require current work identity, exact new evidence, contradicted/incomplete prior assumption, current implementation/diff state, affected unresolved work, possible completed-work impact, and blocker urgency.

## Decide the minimum mutation

Choose one or combine only when necessary: CONTINUE, AMEND_UNRESOLVED, SPLIT, INSERT_PREREQUISITE, ADD_FOLLOWUP, ADD_DISCOVERY, ADD_DECISION, RESEQUENCE, PROMOTE_LEVEL, SUPERSEDE_UNRESOLVED, CORRECT_COMPLETED_WORK.

## Rules

1. Planner is graph mutation authority.
2. Preserve valid completed tickets as historical truth.
3. If completed work becomes wrong, create a corrective/reversal ticket.
4. Rewire blockers explicitly and recompute frontier.
5. Record changed QA/isolation/verification requirements.
6. Block on required human product/approval decisions rather than guessing.
7. Checkpoint the delta before implementation resumes.

## Output

Return the PLAN_DELTA path, new ready frontier, blocked work, and fog changes.
