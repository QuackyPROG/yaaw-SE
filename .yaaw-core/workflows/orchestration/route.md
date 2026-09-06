# Orchestration main loop

## Purpose
Continuously restore project reality and execute one safe canonical workflow at a time until a true stop condition.

## Entry contract
Every public YAAW skill enters this workflow. Resolve its `desired_intent` from `registries/skills.json` and persist `.yaaw/runtime/intent.json`. A desired intent is a destination request, never permission to skip prerequisites.

Before entering the loop, ensure the canonical project structure exists. Use the idempotent project initializer equivalent to `python scripts/init_project.py .`; create missing pieces only and never overwrite durable content.

## Procedure
Repeat:
1. execute `orchestration.inspect-state`;
2. execute `orchestration.reconcile-state` when inconsistencies exist;
3. execute `orchestration.determine-next-action` using observed reality plus active desired intent;
4. if terminal/blocked/human-input stop condition is returned, stop;
5. persist any legal lifecycle admission required before dispatch;
6. execute `orchestration.dispatch` for the one persisted exact handoff;
7. validate the target role's durable output and typed result;
8. Orchestrator alone persists the justified lifecycle transition/state provenance;
9. consume the handoff and return to step 1.

When the requested destination has been validly reached, mark that intent satisfied and continue with normal autonomous routing until another true stop condition.

## Loop safety
If the same repository identity, state, intent, handoff, and expected output repeat without durable mutation/evidence change, stop as `BLOCKED` with `no_progress` rather than spinning.

## Stop conditions
Human product/engineering answer required; evidence/permission unavailable; host requires approval for consequential action; accepted scope is terminal `COMPLETE`; or an unrecoverable `BLOCKED` condition exists.
