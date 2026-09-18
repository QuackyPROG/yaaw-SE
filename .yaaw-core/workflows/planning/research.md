# Planning research

## Purpose
Resolve exactly one pending engineering research question from high-trust primary sources in a fresh Planner dispatch.

## Inputs
Exact current `docs/engineering/research/RSH-NNN.md`, current product and engineering revisions, its frontier ID, only relevant repository context, and selected expertise when needed.

## Procedure
1. Require the RSH status to be `PENDING` and its product/engineering/frontier basis to be current.
2. Prefer official documentation, official specifications, upstream source, first-party APIs, and authoritative release notes. Secondary sources may discover primary sources but do not replace them.
3. Source every material claim. Record version/date for version-sensitive facts and record conflicts instead of choosing silently.
4. If evidence is insufficient, mark the RSH `BLOCKED` and state exactly what proof is missing.
5. If resolved, write findings/source ledger, mark `RESOLVED`, and remove its ID from `engineering.research_pending`.
6. Do not create an `ENG-*` decision merely because research finished. A later fresh Planner promotes verified facts through normal planning.
7. Return the durable result to Orchestrator. Planner never spawns a researcher/peer.

## Output
`RESOLVED` or `BLOCKED` research artifact plus a typed result to Orchestrator.
