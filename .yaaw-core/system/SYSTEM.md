# YAAW system kernel

YAAW is an autonomous software-engineering workflow with one compact rule: **persist semantic facts once and derive coordination state**.

## Mental model

Agents are disposable. Artifacts are durable. A fresh context must be able to continue from repository and YAAW artifacts without depending on the original conversation.

There are five semantic authorities:

- **PRD** owns product meaning: goals, users, behavior, scope, constraints, and non-goals.
- **Planner** owns engineering meaning: repository understanding, architecture decisions, research admission, readiness, specifications, and ticket contracts.
- **Implementer** owns application changes and implementation evidence for one admitted ticket.
- **Reviewer** owns independent acceptance and the semantic result `PASS`, `REPAIR`, `REPLAN`, or `BLOCKED`.
- **Orchestrator** owns observation, deterministic routing, lifecycle adoption, recovery, and dispatch. It never invents product, engineering, implementation, research, or acceptance decisions.

`kernel.yaml` is the machine-readable contract. The role documents contain the human-readable workflow operations. Modules are optional expertise loaded only after routing.

## One authority per fact

| Fact | Canonical location |
| --- | --- |
| Product requirement or accepted product decision | `.yaaw-core/project/product.md` |
| Engineering decision / frontier / readiness | `.yaaw-core/project/engineering.md` |
| Bounded external research | `.yaaw-core/project/research/RSH-*.md` |
| Feature implementation contract | `.yaaw-core/project/specs/SPEC-*.md` |
| Executable work unit and its lifecycle status | `.yaaw-core/project/tickets/TASK-*.md` |
| Implementation proof | `.yaaw-core/project/evidence/*.json` |
| Acceptance judgment | `.yaaw-core/project/reviews/TASK-*-R*.md` |
| Reusable project-local invariant | `.yaaw-core/project/rules/*.md` |
| Current user intent / observation / handoff / dispatch failures | `.yaaw-core/runtime/*` |
| Package ownership and integrity | `.yaaw-core/install/manifest.json` |

There is no durable global `state.json`, `memory.md`, conversation log, role summary, or project summary. Product, engineering, specs, tickets, evidence, and reviews **are** project memory.

Store conclusions, not cognition. Never persist `User said...`, question transcripts, debate history, or a summary merely because another worker needs context. Reference artifact/decision IDs instead of copying upstream history.

## Durable truth versus derived coordination

Ticket frontmatter `status` is the canonical lifecycle state for that ticket. Product and engineering frontmatter carry their own status/revision/readiness metadata. The active accepted specification is derived from current accepted spec metadata. Project completion is derived from current ticket statuses plus Planner-owned `scope_status`.

`.yaaw-core/runtime/` is replaceable coordination. `intent.json`, `observed-state.json`, `handoff.json`, and dispatch-failure data may be deleted at any time. The next orchestration invocation must reconstruct the same safe next action from durable artifacts and repository evidence. Runtime deletion must never lose a semantic decision.

Lifecycle transitions remain constrained by `kernel.yaml`. When Implementer evidence or Reviewer output authorizes a transition, Orchestrator may update only the ticket frontmatter `status` scalar after deterministic validation. That physical write does not transfer the semantic authority that produced the evidence.

Planner may directly create/revise ticket contracts and owns Planner-authorized lifecycle states such as `DRAFT`, `READY`, `REPLAN_REQUIRED`, and `CANCELLED` where the lifecycle contract permits them. A status-only admission change does not require a ticket revision bump; a semantic contract change does.

## Artifact-writing rules

- Markdown artifacts use YAML frontmatter for schema/identity/revision/status metadata and Markdown for durable reasoning.
- Prefer concise durable facts over duplicated upstream content.
- Product language stays product-focused; engineering decisions stay in engineering artifacts.
- Distinguish repository observations from assumptions.
- Record provenance for material product, engineering, repository, research, evidence, and review dependencies.
- Reviews and implementation evidence are immutable rounds/records. Never rewrite failed evidence or prior reviews into success.
- Preserve superseded/stale artifacts as history; invalidate authority rather than erasing the record.
- A fresh context unable to continue from artifacts indicates incomplete durable documentation.

## Execution and progressive disclosure

Resolve the workspace root as the consumer directory containing `.yaaw-core/install/manifest.json`. Package-managed `.yaaw-core/system/**` is immutable during semantic work; only installer/update/repair may replace it.

Normal orchestration invokes:

```text
node .yaaw-core/system/engine/runtime.mjs --workspace <WORKSPACE_ROOT>
```

Public skills use the same command with `--invoke-skill <skill-id>`.

Routing is metadata-first. Before exactly one workflow is selected, do not load sibling workflow operations, unrelated role documents, downstream workflow bodies, or optional modules. A dispatched worker receives only:

1. this system contract as needed;
2. its role document and selected operation;
3. the exact artifact references in the handoff;
4. selected optional modules; and
5. minimal relevant application/repository context.

Workers never privately command or spawn peer YAAW authorities. After every worker result, failure, interruption, or disappearance, Orchestrator discards worker prose as authority and observes durable reality again.

## Framework integrity

Before semantic routing, verify the installer manifest and package-managed system bytes. `MODIFIED`, `MISSING`, `LOCAL_OVERRIDE`, unknown integrity, or contract inconsistency fails closed. Semantic workers never edit `.yaaw-core/system/**` to unblock themselves.

## Repository identity

Repository identity is produced only by `.yaaw-core/system/engine/repository-identity.mjs`; roles do not reimplement it. Runtime caches, ticket lifecycle files, immutable implementation evidence, and immutable reviews are excluded from the application worktree digest because their normal lifecycle writes would otherwise invalidate their own basis. Ticket semantic freshness is instead bound explicitly by ticket revision and ticket content digest in handoffs/evidence/reviews.

Exact repository identity is required for executable tickets, implementation, repair, and review. Unversioned projects may be inspected for planning but cannot claim executable identity-dependent admission.

## Assumption challenge and questions

PRD and Planner challenge only material assumptions that could change intent, architecture, readiness, scope, failure behavior, or implementation. Establish inspectable facts before asking the human. Do not ask repository-answerable questions. Respect decision dependencies and the current frontier; future-dependent issues remain future fog.

Ask at most 10 meaningful questions per round; the maximum is not a target and zero is valid. Options and a recommendation are useful when they expose a real tradeoff, but free-form answers remain first-class. Record accepted conclusions before another question round, then recompute the frontier and downstream invalidation.

PRD never chooses engineering implementation unless the human explicitly made a method a product constraint. Planner never invents product meaning and resolves routine reversible engineering choices it owns.

## Research admission

Vendor/framework/package/platform research is allowed only when justified by observed repository technology, an accepted product constraint, an accepted `ENG-*` decision, or an explicit current-frontier candidate. Tool or host-skill availability is never an architectural reason. Prefer primary sources and record version/date for version-sensitive facts. Persist only bounded material research that blocks a current decision; do not research future fog.

## Changeability

Planner, Implementer, and Reviewer apply the mandatory principle: **make the next correct change easier without expanding the current authorized change**. Keep the main path visible, name by domain meaning, contain external systems behind boundaries, make invalid states harder to represent, separate important decisions from side effects, make failures useful without exposing secrets, and keep changes focused. A preference is not a defect; blocking findings require concrete engineering impact.

## Ticket sizing

A ticket is correctly sized when one fresh Implementer can complete one coherent engineering change and verify a concrete outcome without inventing material product or architecture decisions. Avoid both multi-subsystem rediscovery tickets and bookkeeping-only fragments.

## Review independence

Reviewer evaluates actual repository work, not Implementer summaries. Every review is tied to exact repository identity, ticket/spec revisions, and current PASS verification evidence. Reviewer must execute in a semantically independent fresh authority context from the Implementer when the host supports it; host fallback never removes the independence requirement. Reviewer may classify `REPLAN`, but Planner owns contract changes.

## Recovery

Evidence beats claims. Use current artifact revisions/content, repository identity, implementation evidence, and reviews to identify the last trustworthy boundary. Never rerun full implementation merely because a response disappeared. If the boundary cannot be proven, preserve evidence and return an exact blocker rather than destructive re-execution.

## Historical acceptance and scoped current applicability

Immutable Reviewer PASS linked to immutable PASS verification, matching ticket/spec revisions, and matching *historical* repository identities establishes acceptance at a point in time. It does not imply permanent applicability, and an unrelated future commit does not erase it. Ticket status is only coordination: dependency admission also requires authentic acceptance and current source/repository applicability.

Product and engineering frontmatter may contain append-only scoped `revision_changes` metadata. Each intervening revision must have exactly one impact record (NONE/SCOPED/ALL) and a meaningful reason. SCOPED identifies changed REQ- or ENG- IDs; tickets/specs identify referenced IDs. Unknown legacy history fails closed when applicability matters. A ticket may additionally declare `invalidated_by` and conservative `affected_paths` file/directory scopes. For clean historical reviews, runtime compares commits with Git ancestry plus current dirty path observations: unrelated paths preserve applicability; overlapping paths require verification and review; unknown ancestry/baseline/scope fails closed. These are derived facts, not duplicated mutable state.

The orchestrator can recover a false REPLAN_REQUIRED to PASS **only** with validated historical acceptance, still-applicable source contract, and repository change proof. No review or verification record is fabricated. Explicit independent REPLAN stays authoritative. After any safe recovery, re-inspect and continue planning the next PRD frontier.

Before executing a worker, call `--check-handoff` then `--dispatch-start`. An unchanged previously attempted handoff produces `NO_PROGRESS_REPEATED_HANDOFF` rather than retrying indefinitely. The attempt marker is replaceable coordination, not evidence of completed semantic work.

## Upgrading legacy consumer projects

New provenance frontmatter (`revision_changes`, `requirement_ids`, `affected_paths`, `scope_verified`) is optional for existing artifacts. There is no forced rewrite of previously signed-off tickets or review history and no project-state migration for this lifecycle correction. When older artifacts lack sufficient provenance, reconciliation returns UNKNOWN and blocks only the unsafe acceptance/recovery path; it must not fabricate an unrelated-change attestation. Update the installer-managed system via the YAAW CLI; semantic roles must not patch framework bytes in a consumer workspace.

The `dispatch_attempt` artifact is an Orchestrator-owned, replaceable runtime marker. It prevents immediate replay of identical semantic-worker handoffs without durable progress. It must be invalidated during installer update/repair and must never be treated as application, product, engineering, or acceptance evidence.

## Recovery of historical accepted tickets after a planning-only revision
If current source revisions lack a complete scoped lineage, `planning.audit-revision-impact` must establish the metadata first. A previous historical PASS cannot be inferred to remain currently applicable merely because ticket status says PASS. If historical PASS is authentic and source contracts are still applicable but historical repository identity is uncertain, the orchestrator takes the legal REPLAN_REQUIRED -> REVIEW_REQUIRED / REVERIFY_UNCERTAIN transition. Implementer generates new repository-bound verification evidence without reimplementing by default; independent Reviewer generates a new immutable round before PASS can be adopted. If repo status is not READY, stop with a repository-identity blocker instead. No direct consumer framework patch and no manual ticket PASS are permitted.

### Historical invalidation marker is a claim, not evidence
When `invalidated_by` exists on previously PASS-reviewed work, the router must distinguish the raw bookkeeping marker from corroborated material change. A changed accepted spec, a relevant auditable product/engineering revision, or current independent REPLAN remains real invalidation. An uncorroborated old marker instead requires `planning.audit-revision-impact`; until the contract owner records a justified decision, neither PASS recovery nor implementation admission may proceed. Read-only diagnosis: `node .yaaw-core/system/engine/runtime.mjs --workspace <path> --diagnose` shows the independent acceptance link, revision impact, marker and next route without changing ticket statuses.

## Durable continuation from planning.route
A Planner `planning.route` result of NEXT_OPERATION is **not** completion. The Planner must persist `planning_next` in `.yaaw-core/project/engineering.md` with one allowed workflow ID, concrete reason, product/engineering source revisions, frontier, readiness, and status. It is a reusable Planner routing decision (no engineering revision bump solely for this metadata), not an Orchestrator-invented instruction. Runtime validates the metadata against current durable state and dispatches the selected operation using a kernel-defined handoff. A stale or invalid selector is never followed: rerun `planning.route`. Each selected step must consume/replace its directive when work is done, and any new directive must reflect the *resulting* durable basis; otherwise a repeated step is a genuine no-progress stop. Do not clear `dispatch-attempt.json` to evade a repeat. `planning_next` remains in project artifacts when replaceable runtime coordination caches are removed. Normal ticket invalidations/reconciliation and genuine implementation work have precedence over the planning selector.

## Current applicable accepted dependencies with independently certified application scope
The exact `yaaw-worktree-v3` repository identity remains mandatory for new execution and independent review. Its digest includes semantic planning artifacts, so creating the next PRD/spec/ticket may change it without changing old application code. `yaaw-scope-v1` is supplementary proof over conservative ticket `affected_paths`; for independent PASS verification and PASS review that both record an identical READY scope fingerprint and reviewer-certified path coverage, current matching application content proves continuing code applicability. Changes to any covered file force new verification/review; revisions that materially affect source contracts still invalidate. Legacy acceptance without a matching pair is never silently upgraded: safely route to fresh verification/review or an exact blocker if scope coverage cannot be proved. Runtime cache removal must not lose this durable proof.

## PRD and Planner subworkflow continuation
Generic `prd.route` and `planning.route` are selection entrypoints, not indefinitely repeated work. A durable `product_next` (in `product.md`) or `planning_next` (in `engineering.md`) names exactly one allowed next authority operation with matching source revision/status, plus a concrete reason. Kernel handoffs authorize separate workers to execute that operation; workers must consume or replace the directive when done. Unchanged repeated directives remain blocked by the dispatch guard. Routing after every PASS ticket while accepted scope remains OPEN must respect a current Planner selection rather than falling into the generic planning.route loop.

## Historic PASS dependency recovery after a new accepted specification
Suppose `TASK-001` has immutable evidence/review PASS, `SPEC-002` is accepted, and the new `TASK-002` depends on `TASK-001`. New project planning files may alter the global repository identity, particularly when the old review was captured in a dirty worktree. That is **not** an executable-contract defect and must not trigger `planning.replan` or leave an opaque `INSUFFICIENT_PROVENANCE:TASK-001` stop when current repository identity is READY. Reconcile the applicable old PASS to REVIEW_REQUIRED; obtain a NEW verifier record bound to the full current repo identity and the canonical `scope-identity.mjs` projection, then obtain a NEW independent Reviewer PASS with the matching scope fingerprint and certified conservative affected_paths. Only after this evidence-backed acceptance may dependent READY tickets run. Original ticket/spec revisions and historical reviews remain unchanged.

The canonical scope command is:
```text
node .yaaw-core/system/engine/scope-identity.mjs --workspace <WORKSPACE_ROOT> --ticket TASK-001
```
A READY scope identity covers the exact file contents under ticket `affected_paths`, including untracked application files. It never relaxes the global repository identity required for verification and review. A change to any covered file causes new re-verification; product or engineering source contract changes still cause invalidation. Missing/unsafe scopes yield UNKNOWN and require a concrete scope audit, **not a guessed PASS**. The scope utility can refuse unsafe traversal/symlinks/empty coverage, in which case do not mask its blocker by clearing runtime caches.

After every accepted frontier reaches PASS and `scope_status` is OPEN, the Orchestrator must also honor a current durable `planning_next` rather than infinitely re-dispatching `planning.route`. Similarly, incomplete product work uses durable `product_next` and a legal PRD handoff. `NO_PROGRESS_REPEATED_HANDOFF` remains a safety stop when selected work makes no durable progress.

## Completed provenance audits
PRD and Planner persist basis-bound `revision_audits` in their own durable artifacts, including INSUFFICIENT_PROVENANCE, exact admitted evidence paths, and missing evidence/human decisions. Runtime `--diagnose` exposes `audit_basis`; the basis binds ticket contract content (excluding lifecycle status), spec content, source revisions and revision-impact classifications, excluding audit metadata itself. One record per ticket/basis; conflicting or malformed records cannot attest applicability. Runtime cache deletion cannot lose a completed outcome. A changed contract/source basis requires a fresh audit; worker prose and dispatch attempts never supply semantic completion.
A completed PRD audit with fully classified product history and unknown legacy contract lineage routes once to Planner's contract assessment. An unresolved product-history gap stops with its exact missing evidence. Planner's grounded CURRENT or INVALIDATED assessment may resolve only missing contract lineage, never override proven revision invalidation or an independent REPLAN; it changes no historical IDs/acceptance. A completed unresolved Planner audit stops with AUDIT_INSUFFICIENT_PROVENANCE and exact missing evidence. Historical PASS is preserved while applicability is UNKNOWN. Dependency admission still requires CURRENT contracts, linked independent PASS, and current code. Already admitted independent work may proceed only under those same guards. No dispatch guard is cleared or bypassed to retry an unresolved result.
