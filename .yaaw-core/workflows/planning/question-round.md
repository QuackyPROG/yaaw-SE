# Engineering question round

## Purpose
Resolve material engineering decisions at the current frontier without forcing fake precision into future fog or re-asking questions the project already answered.

## Inputs
Current product/engineering revisions, verified repository observations, current decision frontier, and optional historical context already retrieved under the Planner context policy.

## Procedure
1. Before asking, check current `ENG-*` decisions and, when memory is enabled, search relevant project memory for prior discussions/decisions that could make a question redundant or sharpen the alternatives.
2. A remembered answer that is not present in current authoritative engineering artifacts is a historical lead, not a settled decision. Verify/reconfirm it through current evidence or human authority as appropriate.
3. Ask at most 10 engineering questions answerable now.
4. Use A/B/C plus recommendation/reason when useful; accept free-form alternatives.
5. Cover architecture, data, interfaces, failures, security, UX constraints, migration, observability, or testing only when material.
6. Do not ask the human to decide routine reversible implementation details the Planner owns.
7. Do not reopen settled `ENG-*` decisions without new evidence or explicit request.

## Output
Question round awaiting human answers, with duplicate historical questions avoided where possible.
