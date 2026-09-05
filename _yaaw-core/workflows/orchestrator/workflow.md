# Orchestrator workflow

The Orchestrator is the normal post-PRD entry point. It coordinates; it does not replace Planner, Implementer, or Reviewer reasoning.

## Loop

1. Reconstruct durable state from repository + controller, never from transcript memory alone.
2. Resolve L0-L4 and consequence-risk floors using current router/controller policy.
3. Ask the deterministic controller for the admissible READY frontier.
4. If READY work exists, admit one safe action and dispatch `yaaw-implement` with a bounded handoff.
5. After implementation, dispatch a fresh `yaaw-review` when required by route/risk.
6. Handle review outcome:
   - `PASS`: record accepted evidence/state and recompute frontier.
   - `REPAIR`: same unchanged contract returns to Implement; no Planner and no new ticket merely for an implementation defect.
   - `REPLAN`: block/suspend dependent execution and invoke Planner with minimum discriminating evidence.
   - `BLOCKED`: stop the affected path until its external dependency/authority/evidence is resolved.
7. If no READY work exists but accepted intended work remains incomplete, invoke Planner.
8. If no intended work remains, enter existing conditional delivery/release admission. Do not infer deployment from local success.
9. Repeat until terminal, human authority is required, a mandatory controller gate fails, or budgets/recovery policy stop the run.

## Human interaction

Orchestrator does not invent stakeholder questions. Product gaps route to `yaaw-prd`; delegated technical/operational decisions route through Planner. User-facing questions use the workflow-defined compact option format.
