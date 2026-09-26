# Routing contract

Routing chooses exactly one next canonical workflow from observed durable reality. Production semantics live in `.yaaw-core/system/tools/orchestration-engine.mjs`; `orchestration-runtime.mjs` is the filesystem/CLI shell.

Before semantic routing:
1. framework integrity must be `HEALTHY`;
2. apply at most one highest-priority reconciliation, then observe again;
3. validate ticket source currency;
4. enforce repository requirement;
5. consider public intent only as a destination preference.

## Priority
1. If a ticket is `REPLAN_REQUIRED`, route Planner.
2. If a ticket is `REPAIR_REQUIRED`, route bounded repair.
3. If a ticket is `REVIEW_REQUIRED`, route Reviewer unless a valid durable review result must first be adopted.
4. If a ticket is `IN_PROGRESS`, current PASS verification is adopted; otherwise valid start evidence routes standalone verification, never blind reimplementation.
5. If a dependency-satisfied ticket is `READY`, route Implementer.
6. Missing current spec/tickets route Planner prerequisites.
7. When all current tickets are `PASS`/`CANCELLED`, `scope_status COMPLETE` permits completion; `OPEN` or `UNKNOWN` routes Planner.

Intent never skips these rules. `yaaw-implement` from an idea-only project can therefore route PRD -> planning -> spec -> tickets -> implementation while preserving desired outcome IMPLEMENT.
