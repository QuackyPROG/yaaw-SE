---yaaw-json
{
  "schema": "yaaw.adr/v1",
  "id": "ADR-001",
  "status": "ACCEPTED",
  "decision_owner": "planner / delegated engineering authority",
  "date": "2026-09-04",
  "supersedes": null,
  "approval_ref": null
}
---
# ADR-001: Split engineering judgment from deterministic workflow enforcement

## Context

The original harness expressed state transitions, graph readiness, ownership, scope, QA admission, concurrency and release rules primarily in prose consumed by LLM agents. Those concepts were sound, but autonomous industry use cannot rely on every agent remembering and interpreting every invariant correctly.

## Decision

Keep agents responsible for ambiguous engineering judgment and move mechanically decidable invariants into a deterministic controller, schemas, validators and runtime policies.

The controller may reject an agent-proposed action but must not invent product intent or substitute deterministic heuristics for architectural/product judgment that genuinely requires reasoning.

## Alternatives considered

### Keep policy entirely in prompts

- advantages: minimal implementation and runtime coupling.
- disadvantages: weak enforcement, semantic drift, difficult recovery, poor auditability and no reliable state-machine behavior.

### Add more supervisory agents

- advantages: preserves an all-LLM architecture.
- disadvantages: duplicates policy, increases cost/context drift and still cannot make unsafe actions impossible.

### Deterministic controller plus bounded agents

- advantages: enforceable invariants, auditable transitions, recoverability, typed state and smaller agent contexts.
- disadvantages: controller/schema maintenance and adapter integration work.

## Compatibility / migration

- compatibility window: legacy prose artifacts remain readable, but durable machine state migrates through explicit schema versions.
- migration sequence: structured tickets first, then authority/security/domain packs, then versioned durable artifacts and CI/evals.
- rollback/recovery: commits are phase-aligned and revertible; runtime state is ephemeral and reconstructable from repository truth.
- irreversible consequences: none intended; historical artifacts are never silently reinterpreted.

## Operational impact

- observability/SLO impact: controller events and metrics expose retries, QA results, cost/duration and recovery behavior.
- deployment impact: none for the generic harness itself; consuming projects retain deployment authority.
- ownership impact: controller and schema surfaces are explicitly co-owned by Orchestrator/QA.
- security/trust impact: repository/external content becomes untrusted data unless classified as control/project policy.

## Consequences

- positive: LLMs can focus on engineering reasoning while software enforces workflow invariants.
- negative/tradeoffs: more executable code and tests must remain semantically aligned with documentation.
- verification impact: semantic CI and adversarial conformance evals become mandatory harness gates.

## References

- `docs/initiatives/industry-hardening/map.md`
- `HARDEN-01` through `HARDEN-19`
