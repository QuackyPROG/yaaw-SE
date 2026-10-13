# Dispatch-contract repair evidence

Upstream baseline: `origin/main` at `6d20141`. Work is isolated on branch `fix/dispatch-contract-completeness` in the upstream YAAW-SE repository. Ahoge was inspected only to locate its installed version; its framework and durable project artifacts were not changed.

Release candidate: **0.3.13** (package.json and package-lock.json agree). Publication is a separate observable event: this document does not claim the candidate is already available on npm.

## 1. Root cause and reproduction

The kernel declared public skills and legal workflows for `prd.revise`, `prd.refine`, and `planning.readiness-review` but omitted their handoffs. The router accepted those requests; `runtime.mjs` could not construct an executable worker contract. Core/distribution/payload checks validated workflow existence without validating dispatch completeness. Payload generation copied the incomplete source faithfully; it did not introduce the defect.

Before changing framework files, a hash-healthy generic fixture contained ready product revision 7 and the non-goal “UI redesign is outside current scope.” A human-authorized request to perform full UI redesign requires changing that accepted meaning. Direct `yaaw-revise-prd` invocation and subsequent runtime continuation with the canonical revision intent both reproduced:

```text
exit: 2
type: FRAMEWORK_STOP
reason: FRAMEWORK_CONTRACT_INCONSISTENCY
Error: no handoff contract for prd.revise
    at handoff (.../system/engine/runtime.mjs:38:198)
    at main (.../system/engine/runtime.mjs:55:11)
```

`intent.json` and `observed-state.json` existed; no legal handoff was emitted. The installed framework was healthy, and the product task was valid. The defect was framework contract modeling plus insufficient validation, not a consumer semantic blocker.

`scripts/reproduce_dispatch_contract.mjs` constructs the same small fixture and prints direct/continuation results and its temporary location. With the repair both results are `DISPATCH_READY`. The rollout smoke separately installs the actual published **0.3.12**, reproduces the same failure, and updates from the exact candidate tarball.

The deterministic engine consumes typed intent; it does not perform natural-language scope classification. The host observes the scope conflict and records a product-revision intent. Tests preserve that architecture instead of pretending the router understands arbitrary human prose.

## 2. Complete graph audit

`scripts/audit_workflow_contracts.mjs [system-directory] [skills-directory]` enumerates every workflow, owning role, operation, public shortcut, handoff, and deterministic router target, then runs the canonical validator.

| Surface | Count | Result |
| --- | ---: | --- |
| Declared workflows | 32 | 12 worker dispatch targets, 14 internal operations, 6 root operations |
| Public skills | 12 | Every metadata → workflow → role → intent/completion chain validates |
| Deterministic worker router targets | 9 | Every branch constructs an actual runtime handoff |
| Worker dispatch contracts | 12 | All exist and validate after repair |
| Missing handoffs before repair | 3 | `prd.revise`, `prd.refine`, `planning.readiness-review` |
| Missing handoffs after repair | 0 | No legal worker target remains undispatchable |

Worker dispatch targets:

```text
prd.route, prd.revise, prd.refine
planning.route, planning.readiness-review, planning.create-spec,
planning.create-tickets, planning.replan
implementation.implement-ticket, implementation.verify-ticket,
implementation.repair-ticket
review.review-ticket
```

Internal operations intentionally retain no standalone handoff:

```text
prd.create, prd.question-round, prd.record-decisions, prd.readiness
planning.discover, planning.write-understanding, planning.decision-frontier,
planning.research, planning.question-round, planning.record-decisions
implementation.select-ticket
review.inspect-change, review.classify-findings, review.record-review
```

The six `orchestration.*` operations execute at the root. A lifecycle transition naming `review.record-review` records semantic ownership of a phase inside `review.review-ticket`; it does not establish a standalone worker target. Arbitrary cached intent cannot promote an internal operation into standalone dispatch.

## 3. New invariant and framework changes

A worker dispatch target is the union of:

1. non-Orchestrator public-skill requested workflows;
2. deterministic router targets, using the exact values referenced by router branches;
3. declared worker handoff keys.

Every target must resolve a workflow, owning role, valid handoff, role-bounded artifact reads/writes, admitted active artifact, existing authorized modules, managed instruction/module files, and a compatible typed result protocol. Public skill intent/workflow/completion semantics must also agree. ROOT and INTERNAL operations are exempt from standalone handoff requirements. No new dispatch schema flag was needed.

`system/engine/contracts.mjs` is the single canonical model. Core and distribution Python validators call its CLI adapter. Payload generation and verification load the validator from the transformed payload and validate the payload's own kernel and public skills. Runtime uses the same metadata validation, checks the selected managed files without loading sibling role semantics, and retains defensive handoff construction checks. Build and normal prepack fail for missing handoffs; publish jobs also run the payload gate.

New handoffs grant `prd.revise` and `prd.refine` only product reads/writes. Revision records changed accepted meaning, semantic revision and provenance; draft/questions remain possible. Refinement preserves accepted meaning and revision. Readiness review reads admitted engineering context and writes **only engineering.md**, with `PASS`, `MISSING_DECISIONS`, `PRODUCT_GAP`, `REPLAN`, `BLOCKED` outcomes.

Product-basis staleness remains derived: PRD changes product.md, Orchestrator adopts legal ticket status changes, and Planner revises engineering/spec/ticket contracts. Engineering readiness based on an earlier recorded product revision is now derived as pending; it cannot authorize a new spec when tickets are absent. Explicit revision/refinement can evolve a completed project's product intent. A revised draft cannot prematurely claim completed revision intent; continuation returns to PRD questions/readiness.

Damaged contracts stop with `FRAMEWORK_CONTRACT_INCONSISTENCY`, exit 2, and useful workflow/source-skill/role/version/contract context plus an installer update/repair recommendation. Runtime neither fabricates contracts nor blames consumer product work.

## 4. Regression and semantic evidence

`tests/cli/dispatch-contracts.test.ts` adds 12 focused tests:

- REVISION-1/2: direct and continuing material revision, revision increment, product-only authority, derived stale spec/readiness, legal ticket reconciliation, and Planner dispatch;
- stale engineering with no tickets returns to Planner;
- REVISION-3: revised draft stays draft and continues to product questions;
- REVISION-4: direct refinement preserves semantic revision and downstream source authority;
- completed scope accepts explicit revision/refinement;
- CONTRACT-1: all 12 public shortcuts produce legal handoffs in appropriate prerequisite states;
- CONTRACT-2: all 9 actual deterministic branch targets construct runtime handoffs;
- internal operations reject standalone cached requests;
- CONTRACT-3/4: orphan workflow/role/artifact/module references, incompatible result/completion vocabularies, and unauthorized reads/writes fail validation;
- hash-consistent corrupt kernels stop safely;
- absent/escaping/nonexistent instruction and module references stop before dispatch;
- source core validation, payload generation, and transformed-payload verification all reject a deliberately removed revision handoff.

Lifecycle integration tests use controlled semantic-worker output and explicitly identify it as such. Separately, a fresh isolated YAAW PRD authority worker executed the actual revision handoff on a generic fixture containing downstream engineering/spec/ticket artifacts: revision **7 → 8**, status ready, UI redesign added to accepted scope, approval provenance persisted, and only product.md changed. Runtime then observed `CONTRACT_SOURCE_STALE`, reconciled READY → REPLAN_REQUIRED, and emitted legal `planning.replan` dispatch. The operable YAAW Planner path also produced a bounded repair design in fixture-owned engineering memory. Fresh independent review passed the final repair and all 12 focused tests.

## 5. Validation and supported rollout

Observed locally on Windows with Node 24.17.0 / Python 3.13.14:

- schema/template, canonical core, behavior, lifecycle cases, behavior-oracle compatibility, and distribution checks pass;
- 31 Python tests pass;
- 133 CLI tests across 25 files pass;
- build, TypeScript compilation, payload generation, and payload verification pass;
- normal npm pack/prepack runs the complete gates;
- exact tarball install/update smoke passes Codex, Claude Code, Gemini CLI, Cline, and all four together, including spaces/Unicode paths;
- existing update/repair smoke preserves all durable sentinels, backs up modified framework bytes, migrates the Codex adapter, invalidates caches, and passes doctor;
- minimum supported Node 20.12.0 build passes;
- canonical validator passes source, generated payload, and a fresh standard-profile installation.

The existing Windows directory-symlink escape test used a privileged symlink. Its fixture now uses an unprivileged Windows junction and retains the same escape assertion. Production boundary behavior was not changed.

`scripts/smoke_dispatch_update.mjs` verifies supported **published 0.3.12 → exact candidate 0.3.13** quick-update: all project-owned bytes preserved, package-managed system replaced, runtime caches removed/regenerated, installed standard-profile skill/contract validation passed, and both direct revision and subsequent orchestration continuation dispatch. No project deletion or manual managed-system edit is required. CI runs this rollout regression alongside current package/update smoke gates.

The repository CI also defines Ubuntu, macOS, Windows and minimum-Node jobs. Local Windows and minimum-Node execution are reported separately from cloud job results; unrun platforms are not claimed as passed.

Once 0.3.13 is published, the consumer rollout uses the existing supported command:

```text
npx yaaw-se@0.3.13 install --directory <consumer-root> --action quick-update --yes
```

Then invoke the installed `yaaw-revise-prd` shortcut or continue the typed revision intent through Orchestrator. Select the standard skill profile if all shortcuts are wanted; core deliberately installs only its existing five shortcuts. Durable memory survives either profile.

## 6. Remaining scope and release status

No declared/legal standalone worker workflow remains without a valid dispatch contract. Internal and root operations remain intentionally distinct. True FAST routing and broader terminal acceptance-freshness concerns were not folded into this repair. Only product-evolution admission and revision-draft completion behavior necessary for these regressions changed.

Candidate version: **0.3.13**. npm publication and remote platform CI must be observed before claiming a released, universally validated fix. The local framework invariants and supported tarball rollout pass; this report does not fabricate published availability.
