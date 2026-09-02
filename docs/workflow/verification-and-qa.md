# Verification and Independent QA

## Verification seams

Each contract names the highest stable externally meaningful seam that can prove the behavior. Prefer testing observable contracts over implementation details. Reuse existing seams before creating new ones.

During implementation, run the narrowest useful checks frequently; run the broader configured suite before acceptance when the route requires it.

## Risk-weighted verification

Verification depth scales with consequence and failure likelihood. Prioritize:

- authorization and trust boundaries;
- payments, destructive writes, and data loss;
- secrets/privacy;
- migrations and compatibility;
- concurrency and ordering;
- retries/idempotency and partial completion;
- external side effects/providers;
- timeout/recovery paths;
- irreversible state transitions.

Test count and aggregate coverage are supporting signals. They do not substitute for exercising the riskiest behavior.

Prefer higher-fidelity integration or real-dependency checks when mocks can only restate the implementation's own assumptions and the risk justifies the cost.

## Self-verification

L0/L1 may self-verify only when the route has no independent-QA trigger. A skip must be explicit as `QA_NOT_REQUIRED_BY_ROUTE`; missing QA state is not equivalent to a skip.

## Mandatory independent QA

Independent fresh QA is required for L2+, architecture/migration, shared or broad ownership, security/auth/secrets/privacy/payments/trust boundaries, external providers, CI/CD/release policy, material dependency/interface changes, destructive operations, and any material scope promotion unless a consuming domain pack is stricter.

## QA input

QA starts from:

1. the actual Git diff/fixed comparison point;
2. the originating ticket plus relevant PRD/spec/decision/map;
3. preservation invariants and expected change surface;
4. verification evidence;
5. ownership/scope policy;
6. affected canonical docs.

Implementer summaries are hints, not evidence.

## QA axes

- **Intent/contract fidelity** — did the diff implement accepted behavior and relevant product intent without material omission or unapproved behavior?
- **Preservation invariants** — did protected properties remain true?
- **Engineering standards** — correctness, maintainability, semantic duplication, error handling, lifecycle behavior, tests, and repository conventions.
- **Blast radius** — did actual paths/behavior exceed allowed scope or expected change surface? Every deviation needs explanation.
- **Evidence quality** — are tests/commands meaningful and actually executed at sufficient fidelity?
- **Risk coverage** — were dangerous negative, retry, timeout, concurrency, destructive, or trust paths tested where relevant?
- **Documentation/memory** — did durable facts/decisions move with the code without silently rewriting accepted product intent?

## Evidence confidence

Material findings use one of:

- `CONFIRMED` — directly reproduced or proven by executed/static/runtime evidence;
- `SUPPORTED` — strong evidence supports the finding but one material condition remains indirect;
- `SUSPECTED` — plausible risk requiring further discovery before it becomes a defect claim;
- `UNKNOWN` — evidence is insufficient.

A suspected issue may create DISCOVERY work; it should not be laundered into a confirmed DELIVERY fix.

Return `PASS`, `REPAIR_REQUIRED`, or `STOP_AND_REPLAN`. QA does not repair the implementation in the same review context.
