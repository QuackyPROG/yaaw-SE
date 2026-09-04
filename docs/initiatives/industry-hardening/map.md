---yaaw-json
{
  "schema": "yaaw.initiative-map/v1",
  "id": "INIT-INDUSTRY-HARDENING",
  "level": 4,
  "status": "ACTIVE",
  "spec_ref": null,
  "prd_ref": null,
  "revision": 8
}
---
# Industry Hardening

## Destination

Turn yaaw-SE from an instruction-heavy engineering methodology into a self-hosting, machine-enforced autonomous engineering harness whose workflow state, authority, security, evidence, delivery and failure modes are deterministic where they can be.

## Constraints / standing notes

- Preserve L0-L4 cheapest-safe routing, DISCOVERY/DECISION/DELIVERY, fog/frontier, STOP_AND_REPLAN, PLAN_DELTA, immutable completed history, observed-vs-intent truth and manual-only PRDs.
- Do not add agents merely to compensate for missing deterministic machinery.
- `main` remains untouched until the exact HARDEN-19 VERIFYING candidate passes the final integration gate.
- Every coherent phase/correction is a separate commit.
- Completed work is reconstructed only from actual repository commits and CI evidence.

## Decisions so far

- [`ADR-001`](../../decisions/001-deterministic-control-plane.md): engineering judgment remains with agents; workflow invariants move into deterministic controller machinery.
- Domain packs extend project-specific facts without silently weakening generic invariants.
- Role files own identity/authority; skills own procedure.
- Fresh QA reduces anchoring but high assurance additionally requires orthogonal executable evidence.
- Runtime/model profiles are capability-based and fail closed; operating modes may strengthen gates but cannot alter authority semantics.
- Mutating controller operations are explicit, atomic/idempotent where retry is possible, and repository state remains authoritative over ephemeral snapshots.
- Repository host, tracker and provider data are evidence-only inputs; domain-pack lifecycle and cross-repository coordination are typed and compatibility-checked.
- QA findings/residual risks use stable identities; retrieval is provider-neutral/evidence-only; archive manifests preserve stable source paths; metrics diagnose rather than decide product intent.
- Public maturity claims distinguish machine-enforced, agent-judgment and runtime-dependent behavior; executable examples are CI fixtures rather than proof-by-documentation.
- Final audit added semantic guards for conditional Release Engineer ordering, authority-subset consistency, self-hosting ownership, cold-start controller/security authority, rename/copy endpoint scope, and explicit command side-effect capabilities.

## Current frontier

Controller-visible work:

- `HARDEN-19` — VERIFYING final whole-branch integration audit and non-destructive main promotion.

## Final audit checkpoint

- live main: `82c65e03af90e8c9b2d23e4810e41760f9fd0b37`
- audited implementation head: `1ac72ddbfbaf881154e7ba24428a902b50e44ea5`
- relation: ahead-only, 33 commits ahead, 0 behind, merge base equals live main
- latest implementation CI `33849395459`: SUCCESS
- scope correction CI `33848872419`: SUCCESS
- audit corrections remain explicit commits; no history rewrite/force update.
- next gate: CI on the exact VERIFYING status/evidence candidate, then live-main freshness and fast-forward promotion.

## Not yet specified / fog

No speculative specialist agents are authorized. Dependency-change or data-migration specialist procedures are added only if dogfooding/evals show the generic architecture/change/implementation procedures are insufficient.

## Out of scope

- Product-specific engineering rules that belong in a consuming repository's domain pack.
- Production promotion authority not explicitly delegated by a consuming project.
- Replacing project-native tests, CI, observability or security tooling with generic harness checks.

## Integration / QA strategy

- One coherent phase/correction per commit.
- CI runs structural, semantic, schema, migration, state, policy, unit, adversarial eval and scope checks.
- L4 changes require high-assurance review evidence.
- Final promotion requires an audit of `main...feat/industry-hardening`, green CI at the exact final VERIFYING SHA and no stale source/branch state.

## Recovery / resumption

A fresh Orchestrator resumes by reading this map, computing ticket state/frontier, inspecting the current branch SHA/CI, and loading only the current ticket plus referenced sources. Chat history is not required for correctness.
