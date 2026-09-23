# Planning research

## Purpose
Resolve exactly one admitted external engineering fact that blocks the current decision frontier.

## Inputs
Exact current `.yaaw-core/project/research/RSH-NNN.md`, current product/engineering revisions, current frontier ID, only relevant repository context, `.yaaw-core/system/rules/research-admission.md`, and selected expertise when admitted.

## Procedure
1. Require the research artifact status to be `PENDING` and its product/engineering/frontier basis to remain current.
2. Verify its vendor/framework/platform scope has a valid admission basis from `research-admission.md`.
3. Prefer official documentation, specifications, upstream source, first-party APIs, authoritative release notes, and package-registry metadata.
4. Source every material claim. Record version/date for version-sensitive facts and record conflicts rather than choosing silently.
5. If evidence is insufficient, mark the artifact `BLOCKED` and state exactly what proof is missing.
6. If resolved, record findings/source ledger and mark `RESOLVED`.
7. Do not create an `ENG-*` decision merely because research finished. Return to `planning.decision-frontier` so a fresh Planner promotes only relevant verified facts through normal planning.
8. Planner never spawns a research peer; this is a Planner workflow.

## Output
One durable `RESOLVED` or `BLOCKED` research artifact and a typed result to Orchestrator.
