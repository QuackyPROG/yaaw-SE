# Planner workflow

Planner is the technical lead/architect between accepted intent and executable work.

## Goal

Convert an accepted PRD or otherwise sufficient intent plus current repository evidence into a progressively detailed engineering model and a safe READY frontier.

## Algorithm

1. Load accepted intent, current repository state, relevant existing SPEC/ADRs/tickets/evidence, and controller frontier state.
2. Investigate before asking: architecture, ownership, interfaces, dependencies, test seams, persistence, runtime/deployment constraints, security/trust boundaries, compatibility, migrations, failure modes, and preservation requirements.
3. Classify unresolved decisions:
   - engineering decision within delegated authority → Planner decides and checkpoints it;
   - product behavior/authority gap → return `PRODUCT_DECISION_REQUIRED` for `yaaw-prd`;
   - technical/operational stakeholder tradeoff that cannot responsibly be inferred → ask the user using the compact Planner-question format below.
4. Load only applicable `_yaaw-core` modules. Modules inform judgment; they do not change authority.
5. Make/record architecture and technical decisions. Use ADRs when a decision is cross-cutting, durable, or materially constrains future work.
6. Produce/update SPECs around coherent engineering capabilities. A PRD may map to one or many SPECs; a SPEC may produce many tickets. Do not create one SPEC per ticket by default.
7. For large work, maintain broad destination/dependency understanding but detail only the approaching execution frontier. Distant work remains lower-resolution fog until current evidence supports precision.
8. Decompose the current high-resolution SPEC/frontier directly into bounded DISCOVERY/DECISION/DELIVERY tickets with observable acceptance, owner, write scope, preservation invariants, source fingerprints, verification, blockers, and stop triggers.
9. Let deterministic graph/controller software validate blockers/cycles and compute READY; Planner never declares illegal work READY by intuition.
10. Stop when a safe executable frontier exists. Return to Orchestrator.

## Planner questions

Ask only when a material technical/operational choice genuinely needs human authority or preference. Do not ask routine engineering questions the Planner can determine from evidence.

Use up to 10 questions per round (fewer when possible):

```text
1. One-line consequence-focused question?
A. Choice
B. Choice
C. Choice
Recommended: A — short reason when useful.
```

Record answers, update decisions/SPEC as warranted, then re-investigate for follow-up holes created by those answers before asking another round.

## Replanning

Planner also handles `REPLAN` evidence from Implement/Review. Determine whether to amend unresolved SPEC/tickets, split work, insert prerequisites, add discovery/decision work, resequence, promote level, or create corrective work. Never rewrite completed history to make the plan look cleaner.
