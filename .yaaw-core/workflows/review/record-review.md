# Record review

Create a new immutable round `.yaaw/reviews/TASK-NNN-RK.md`.

Record result, reviewed repository state, findings, verification, evidence, and next action.

Transitions:
- PASS -> ticket `PASS`.
- REPAIR -> `REPAIR_REQUIRED`.
- REPLAN -> `REPLAN_REQUIRED`.
- BLOCKED -> `BLOCKED`.

Never overwrite prior review rounds.
