---
name: plan-delta
description: Safely change an active unresolved ticket graph when implementation, discovery or QA produces material new evidence, without silently widening scope or rewriting completed history.
---

# Plan Delta

## Trigger capsule

Require: current work identity, exact new evidence, contradicted/incomplete prior assumption, current implementation/diff state, affected unresolved work, possible completed-work impact, and blocker urgency.

## Decide the minimum mutation

Choose one or combine only when necessary:

- CONTINUE
- AMEND_UNRESOLVED
- SPLIT
- INSERT_PREREQUISITE
- ADD_FOLLOWUP
- ADD_DISCOVERY
- ADD_DECISION
- RESEQUENCE
- PROMOTE_LEVEL
- SUPERSEDE_UNRESOLVED
- CORRECT_COMPLETED_WORK

## Rules

1. Planner is the graph mutation authority.
2. Preserve already-valid completed tickets as historical truth.
3. If completed work becomes wrong, create a corrective/reversal ticket; do not edit history to imply the old work never happened.
4. Rewire blockers explicitly and recompute frontier.
5. Record changed QA/isolation/verification requirements.
6. If the delta requires a human product/approval decision, block dependent work rather than guessing.
7. Checkpoint the delta before implementation resumes.

## Output

Use `docs/templates/plan-delta.md`. Return the new ready frontier plus any blocked/fog changes.
