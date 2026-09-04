---
name: intake-routing
description: Use at task intake to resolve ownership and risk and choose the cheapest safe L0-L4 route.
---

# intake-routing

## Purpose

Convert a raw request into a structured `yaaw.task-profile/v1` using the cheapest safe route.

## Artifact contract

Resolve `.agents/artifacts.json`, `.agents/router.json`, ownership and the applicable domain pack. Produces `TASK_PROFILE`; does not mutate product code or material graph structure.

## Procedure

1. Classify work shape without treating the label itself as the risk level.
2. Resolve likely owner/subsystem and investigate bounded unknowns before asking the human.
3. Score planning signals: uncertainty, subsystem/interface breadth and architectural/migration scope.
4. Score consequence signals: criticality, auth/trust/secrets/privacy/payments, destructive/production side effects and reversibility.
5. Apply work-shape default then deterministic risk floors; record reasons and QA profile.
6. For trivial observable bugs/features allow L0 when scope/risk truly qualify.
7. Return goal, observable acceptance, owner, level, uncertainty/blast/reversibility, QA profile, artifacts and next action.
