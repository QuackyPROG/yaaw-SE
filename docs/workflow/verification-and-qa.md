# Verification and Independent QA

## Verification seams

Each contract names the highest stable externally meaningful seam that can prove the behavior. Prefer testing observable contracts over implementation details. Reuse existing seams before creating new ones.

During implementation, run the narrowest useful checks frequently; run the broader configured suite before acceptance when the route requires it.

## Self-verification

L0/L1 may self-verify only when the route has no independent-QA trigger. A skip must be explicit as `QA_NOT_REQUIRED_BY_ROUTE`; missing QA state is not equivalent to a skip.

## Mandatory independent QA

Independent fresh QA is required for L2+, architecture/migration, shared or broad ownership, security/auth/secrets/privacy/payments/trust boundaries, external providers, CI/CD/release policy, material dependency/interface changes, destructive operations, and any material scope promotion unless a consuming domain pack is stricter.

## QA input

QA starts from:

1. the actual Git diff/fixed comparison point;
2. the originating ticket/spec/decision/map;
3. verification evidence;
4. ownership/scope policy;
5. affected canonical docs.

Implementer summaries are hints, not evidence.

## QA axes

- **Spec/contract fidelity** — did the diff implement the accepted behavior and nothing materially different?
- **Engineering standards** — correctness, maintainability, duplication, error handling, lifecycle behavior, tests, and repository conventions.
- **Blast radius** — did actual writes/behavior exceed the allowed owner/scope?
- **Evidence quality** — are tests/commands meaningful and actually executed?
- **Documentation/memory** — did durable facts/decisions move with the code?

Return `PASS` or `REPAIR_REQUIRED` with bounded findings. QA does not repair the implementation in the same review context.
