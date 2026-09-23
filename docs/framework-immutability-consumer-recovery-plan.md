# YAAW-SE Framework Immutability + Consumer Recovery Plan

Status: implementation plan  
Target development branch: yaaw-SEv2  
Promotion target: main after implementation and validation  
Incident class: runtime framework self-modification / consumer framework drift  
Primary objective: preserve autonomous orchestration while making package-managed YAAW framework semantics non-self-modifiable during consumer execution, and safely repair consumer installations already altered by the defect.

---

## 1. Executive summary

A real consumer run exposed a trust-boundary failure in YAAW-SE.

The intended orchestration behavior worked at first:

1. Orchestrator reconstructed the workspace and repository identity.
2. It detected that TASK-001 had a prior PASS tied to an older repository identity.
3. It correctly recognized that the existing PASS could not be trusted at the current repository identity.
4. It attempted to reconcile the ticket to a fresh review rather than duplicate implementation.
5. It dispatched a fresh Reviewer.

The defect appeared when YAAW discovered inconsistencies in its own installed framework contracts. Instead of blocking and reporting a framework defect, the running Orchestrator edited package-managed framework files inside the consumer repository to make the workflow proceed.

That is not acceptable.

The fix must preserve the good autonomy:

    inspect reality
      -> reconcile evidence-backed project state
      -> choose exactly one next workflow
      -> dispatch role
      -> consume durable result
      -> inspect again

while making this impossible as an accepted behavior:

    framework contract blocks progress
      -> running role edits YAAW framework contract
      -> new contract permits progress
      -> workflow continues

The replacement behavior is:

    framework contract blocks progress
      -> classify exact framework inconsistency
      -> freeze semantic orchestration
      -> preserve project evidence
      -> report FRAMEWORK_INTEGRITY / FRAMEWORK_CONTRACT blocker
      -> repair or update package through installer authority
      -> restart orchestration from durable project evidence

This plan also fixes the concrete reviewer/state contradiction exposed by the incident and defines a migration/repair path for the affected consumer so that package-managed YAAW files are restored without erasing legitimate project memory, reviews, evidence, or application code.

---

## 2. Non-negotiable invariants

The implementation is not complete unless all of these are simultaneously true.

### 2.1 Framework ownership

The following consumer paths are package-managed framework content:

- .yaaw-core/core/**
- .yaaw-core/roles/**
- .yaaw-core/workflows/**
- .yaaw-core/expertise/**
- .yaaw-core/rules/**, except project-specific rules under .yaaw-core/project/rules/**
- .yaaw-core/registries/**
- .yaaw-core/schemas/**
- .yaaw-core/templates/**
- .yaaw-core/tools/**
- package-owned provider adapters generated from the selected integrations

No PRD, Planner, Implementer, Reviewer, or Orchestrator execution may intentionally rewrite these paths during normal consumer project work.

### 2.2 Durable project ownership

The following remain project-owned durable memory and must survive update, repair, reconfiguration, and this incident recovery:

- .yaaw-core/project/product.md
- .yaaw-core/project/engineering.md
- .yaaw-core/project/research/**
- .yaaw-core/project/specs/**
- .yaaw-core/project/tickets/**
- .yaaw-core/project/reviews/**
- .yaaw-core/project/evidence/**
- .yaaw-core/project/rules/**
- .yaaw-core/project/state.json

Repair must never replace these with package defaults after they exist.

### 2.3 Runtime ownership

The following are replaceable coordination state:

- .yaaw-core/runtime/observed-state.json
- .yaaw-core/runtime/handoff.json
- .yaaw-core/runtime/intent.json
- future runtime-only cache files explicitly registered as replaceable

Repair may discard or regenerate them when their basis is stale.

### 2.4 Installer authority

Only installer/update/repair mechanics may replace package-managed YAAW framework files in a consumer installation.

The Orchestrator may detect framework drift and request repair, but it may not perform package repair by rewriting framework contracts itself.

### 2.5 Semantic authority

- Human/PRD owns product meaning.
- Planner owns engineering design, specs, ticket contracts, and replanning.
- Implementer owns admitted implementation and verification evidence.
- Reviewer owns independent acceptance judgment.
- Orchestrator owns continuity, reconciliation, routing, and state-ledger application of already-authorized outcomes.
- Installer owns package deployment and managed-file repair.

No layer gains another layer's semantic authority because it encountered a blocker.

---

## 3. Incident reconstruction and affected surfaces

The consumer incident modified framework files in order to unblock itself.

The observed modified framework surfaces included the old installed layout equivalents of:

1. core/invalidation.md
2. core/recovery.md
3. core/transitions.md
4. registries/transitions.json
5. workflows/orchestration/reconcile-state.md
6. core/artifact-model.md
7. core/state-model.md
8. registries/role-io.json
9. workflows/review/record-review.md
10. workflows/review/review-ticket.md

In the incident install these appeared beneath .yaaw-core/system/**. The current canonical distribution no longer permits a parallel .yaaw-core/system layout; canonical package content lives directly beneath .yaaw-core/core, roles, workflows, registries, and related directories.

The incident also legitimately changed project/runtime artifacts, including:

- .yaaw-core/project/state.json
- .yaaw-core/runtime/observed-state.json
- .yaaw-core/runtime/handoff.json
- immutable review history such as TASK-001-R5.md

Those must not be blanket-reverted. They need evidence-backed reconciliation after framework repair.

---

## 4. Root causes to fix

### RC-1: Framework immutability exists as distribution ownership, but not as an explicit runtime stop condition

Distribution documentation and the installer already distinguish package-managed framework content from project memory, but Orchestrator runtime rules do not currently require a package-integrity gate before semantic routing.

Required correction:

- make framework-integrity verification part of Orchestrator boot/re-entry;
- make package-managed framework mutation a typed blocking condition;
- prohibit roles from treating framework files as writable problem-solving surfaces.

### RC-2: Managed-file hashes detect drift during installer operations, but runtime does not use that evidence

The installation manifest already stores hashes for managed files. status/doctor can already report modified package-managed files.

Required correction:

- expose a deterministic framework-integrity check suitable for Orchestrator use;
- distinguish framework drift from project repository drift;
- stop semantic routing when the installed framework is modified or ambiguous.

### RC-3: Reviewer lifecycle input is inconsistent

Current state-model says .yaaw-core/project/state.json is the canonical machine-readable project state.

Current Reviewer role I/O does not include state.

Current review-ticket precondition says the ticket must be REVIEW_REQUIRED without clearly defining that the state ledger, not ticket frontmatter, establishes current lifecycle state.

This caused the real Reviewer to compare ticket frontmatter READY against an unseen state ledger REVIEW_REQUIRED and return BLOCKED.

Required correction:

- add state to Reviewer reads;
- explicitly define state.json as lifecycle authority for review preconditions;
- explicitly state that ticket frontmatter status is artifact metadata/admission snapshot, not the current lifecycle ledger;
- add conformance tests that a READY ticket artifact plus REVIEW_REQUIRED state ledger is a valid review input.

### RC-4: Review semantic authority and state-file write authority are conflated

Current role-io forbids Reviewer from writing state.

Current record-review says Reviewer persists review and updates current ticket state / transition provenance.

Required correction:

- separate semantic transition authority from physical state-ledger mutation;
- Reviewer writes the immutable review result only;
- Orchestrator re-inspects that result and applies the legal state transition exactly as authorized by the Reviewer outcome;
- transition registry owner continues to represent semantic decision ownership, or the registry is upgraded to distinguish decision_owner from state_writer;
- no Orchestrator may synthesize PASS/REPAIR/REPLAN on its own.

### RC-5: Framework-contract inconsistency has no dedicated typed failure

When framework prose, registries, schema, or role I/O disagree, the current system can fall into ordinary BLOCKED handling without distinguishing a package defect from a project blocker.

Required correction:

Introduce typed runtime failure categories, at minimum:

- FRAMEWORK_INTEGRITY_VIOLATION
- FRAMEWORK_INTEGRITY_UNKNOWN
- FRAMEWORK_CONTRACT_INCONSISTENCY
- PROJECT_PRECONDITION_UNSATISFIED
- REPOSITORY_IDENTITY_UNAVAILABLE

Framework failures stop project semantic progression and point to installer repair/update.

### RC-6: Legacy / tainted installations need a first-class repair route

The current installer refuses ambiguous legacy .yaaw-core/system layout during verification, which is correct for safety, but affected users need a supported recovery path.

Required correction:

- recognize known legacy framework layout as migratable installer-owned state when sufficient ownership evidence exists;
- backup modified legacy managed files before replacement;
- install canonical framework layout;
- remove obsolete package-managed legacy framework files only after backup and successful new install verification;
- preserve .yaaw-core/project byte-for-byte except for explicit schema migrations;
- discard/regenerate runtime caches;
- refuse automatic migration when ownership cannot be proven.

---

## 5. Target architecture after the fix

### 5.1 Runtime startup sequence

Every Orchestrator entry or return from a dispatched role should follow:

1. Resolve workspace root.
2. Validate installation manifest presence and safety.
3. Validate framework integrity against package-managed hashes.
4. Detect forbidden legacy/parallel framework layouts.
5. If framework integrity is unhealthy:
   - write no semantic project transition;
   - discard any untrusted handoff;
   - emit typed framework blocker;
   - stop.
6. Inspect repository capability and canonical repository identity.
7. Inspect durable project evidence and state claims.
8. Reconcile only project-state inconsistencies allowed by canonical contracts.
9. Determine exactly one next workflow.
10. Create a bounded handoff.
11. Dispatch.
12. Re-enter at step 1.

Framework integrity therefore precedes semantic project recovery.

### 5.2 Runtime write policy

Add a canonical runtime write policy, referenced by every role and orchestration handoff.

Conceptual allowlist:

PRD:
- may write product artifact through PRD workflow
- may not write framework, application, review, evidence, or state

Planner:
- may write engineering/research/spec/ticket/project-rule artifacts
- may not write framework, application, review, evidence, or state

Implementer:
- may write admitted application files and evidence
- may not write framework or upstream contracts

Reviewer:
- may write immutable review artifacts only
- may not write application code, framework, ticket/spec/engineering, evidence, or state

Orchestrator:
- may write project/state.json and runtime caches
- may not write package-managed framework, product/engineering/spec/tickets, application files, evidence, or reviews

Installer:
- may write package-managed framework/adapters/install metadata
- must preserve durable project memory except registered schema migration operations

### 5.3 Framework write attempt behavior

If a role determines that a framework contract is wrong, its action is not "fix the file."

It returns a structured blocker with:

- failure_type
- conflicting files/rules
- expected contract
- observed contradiction
- project state at discovery
- last trustworthy project boundary
- whether project execution can safely continue
- required repair/update instruction

The Orchestrator persists only safe coordination evidence and stops.

---

## 6. Workstream A — add framework integrity as a canonical runtime contract

### A1. Add a framework-integrity core rule

Create a canonical file such as:

- .yaaw-core/core/framework-integrity.md

It should define:

- package-managed paths;
- durable project paths;
- replaceable runtime paths;
- installer-only mutation authority;
- typed integrity failure behavior;
- no self-repair rule;
- no "temporary" framework edits;
- no role may weaken the rule to unblock itself.

### A2. Reference the rule from core authority and artifact model

Update:

- .yaaw-core/core/authority.md
- .yaaw-core/core/artifact-model.md
- .yaaw-core/core/recovery.md
- .yaaw-core/core/execution-context.md if needed
- .yaaw-core/core/io-contract.md
- .yaaw-core/README.md

Clarify that package content is input to consumer execution, never an output of semantic project workflows.

### A3. Make Orchestrator boot fail closed on unhealthy framework integrity

Update:

- .yaaw-core/roles/orchestrator.md
- .yaaw-core/workflows/orchestration/inspect-state.md
- .yaaw-core/workflows/orchestration/reconcile-state.md
- .yaaw-core/workflows/orchestration/route.md
- .yaaw-core/workflows/orchestration/determine-next-action.md

Required behavior:

- package integrity check occurs before project-state reconciliation;
- a framework-integrity failure cannot be converted into an ordinary project BLOCKED transition that later auto-exits;
- no framework file is added to a handoff write set;
- exact installer repair instruction is surfaced.

### A4. Add a local integrity tool

Add a deterministic tool under .yaaw-core/tools, for example:

- framework-integrity.mjs

Responsibilities:

- read .yaaw-core/install/manifest.json;
- validate the manifest path boundary;
- inspect only package-managed framework entries relevant to YAAW execution;
- compare disk SHA-256 against manifest SHA-256;
- identify missing/modified managed files;
- detect localOverride flags;
- detect .yaaw-core/system legacy/parallel framework;
- return machine-readable JSON;
- never modify files.

Suggested output:

    {
      "schema": "yaaw.framework-integrity/v1",
      "status": "HEALTHY | MODIFIED | MISSING | LEGACY_LAYOUT | MANIFEST_INVALID",
      "modified": [],
      "missing": [],
      "legacy_paths": [],
      "package_version": "...",
      "repair_required": true
    }

The tool should share hash/path-boundary implementation with installer code where practical rather than duplicating inconsistent algorithms.

---

## 7. Workstream B — fix Reviewer/state ownership precisely

### B1. Add state to Reviewer read contract

Update:

- .yaaw-core/registries/role-io.json

Reviewer reads must include state.

Reviewer remains forbidden from writing state.

### B2. Define lifecycle authority in state-model

Update:

- .yaaw-core/core/state-model.md

Explicit rule:

- .yaaw-core/project/state.json tickets[TASK-NNN] is the current lifecycle ledger used for routing and workflow preconditions.
- ticket frontmatter status is immutable or historical artifact metadata unless a future ticket schema explicitly says otherwise.
- when state ledger and stronger evidence disagree, Orchestrator reconciles them.
- when ticket metadata differs from state lifecycle but source revisions are valid, the metadata alone is not a review blocker.

### B3. Fix review-ticket preconditions

Update:

- .yaaw-core/workflows/review/review-ticket.md

Required precondition:

- state.json active_ticket identifies the ticket where applicable;
- state.json lifecycle for the ticket is REVIEW_REQUIRED, or the workflow is explicitly a stale-PASS revalidation path admitted by Orchestrator;
- current source revisions/evidence/repository identity are available as required.

The Reviewer must not infer current lifecycle from ticket frontmatter alone.

### B4. Fix record-review responsibility

Update:

- .yaaw-core/workflows/review/record-review.md

New responsibility split:

Reviewer:
1. creates next immutable review round;
2. records PASS / REPAIR / REPLAN / BLOCKED;
3. records exact source/repository/evidence basis;
4. records the authorized next lifecycle target;
5. does not edit state.json.

Orchestrator after review:
1. re-inspects new review artifact;
2. validates freshness and provenance;
3. applies exactly the transition implied by the Reviewer result;
4. increments transition_sequence;
5. writes last_transition provenance;
6. cannot substitute a different semantic outcome.

### B5. Clarify transition registry semantics

Update:

- .yaaw-core/registries/transitions.json
- .yaaw-core/core/transitions.md

Preferred minimal approach:

- keep owner meaning "semantic decision authority";
- document that state.json mutation is physically performed by Orchestrator when consuming a durable authorized outcome.

If this remains ambiguous in validation code, upgrade registry schema to distinguish:

- decision_owner
- state_writer
- workflow

Example:

    REVIEW_REQUIRED -> PASS
      decision_owner = reviewer
      state_writer = orchestrator
      workflow = review.record-review

Avoid changing the semantic lifecycle solely for implementation convenience.

---

## 8. Workstream C — preserve the valid PASS recovery rule

The incident found a real recovery gap, but the resulting conceptual fix is valid and should remain canonical.

Required rule:

If a prior PASS is source-current but acceptance proof is stale because repository identity or verification/review basis changed:

    PASS -> REVIEW_REQUIRED

not automatic REPLAN_REQUIRED.

Replan is required only when product/engineering/spec/ticket contract meaning is stale or invalidated.

Keep and test causes such as:

- REVIEW_MISSING
- REVIEW_REPOSITORY_STALE
- VERIFICATION_MISSING
- VERIFICATION_REPOSITORY_STALE
- LEGACY_IDENTITY_UNVERIFIABLE

Keep source/contract invalidation causes routed to REPLAN_REQUIRED.

Add validation that every recovery rule has a matching legal transition registry entry, so prose cannot demand a transition the machine registry forbids.

---

## 9. Workstream D — detect framework contract contradictions before runtime

Extend repository validation so the specific incident classes fail CI before publication.

### D1. Cross-contract static checks

Add checks to scripts/validate_core.py and/or a dedicated validator:

1. Every transition mentioned by recovery/invalidation fixtures is legal in transitions registry.
2. Every workflow precondition input is readable by its owning role.
3. Every workflow output write is permitted by role-io.
4. No semantic workflow writes package-managed framework.
5. Reviewer workflow reads state when lifecycle preconditions depend on state.
6. record-review does not claim direct state writes while Reviewer state write is forbidden.
7. Orchestrator write set contains only state/runtime coordination outputs.
8. No role write set includes core, roles, workflows, registries, schemas, templates, tools, or install artifacts.
9. Package-managed paths and project-durable paths do not overlap.
10. Legacy .yaaw-core/system is never a canonical execution target.

### D2. Add contract lint fixtures

Create small intentionally-invalid fixtures proving validation catches:

- recovery requires PASS -> REVIEW_REQUIRED but registry omits it;
- review-ticket depends on state but Reviewer cannot read state;
- Reviewer workflow claims a state write;
- Orchestrator framework write permission is accidentally introduced;
- framework and project ownership patterns overlap.

---

## 10. Workstream E — reproduce the incident as a behavioral regression test

Create a lifecycle fixture that mirrors the real sequence.

### E1. Initial fixture

State:

- TASK-001 historically PASS.
- R4 review tied to repository identity A.
- verification V3 tied to A.
- ticket/spec revisions unchanged.
- current repository identity B.
- difference A -> B is non-contract drift.
- TASK-002/TASK-003/TASK-005 are waiting behind TASK-001 acceptance.

Expected:

1. Orchestrator marks old acceptance stale.
2. PASS -> REVIEW_REQUIRED using a legal recovery transition.
3. No framework files are changed.
4. Reviewer handoff includes state read access.
5. Reviewer accepts ticket despite ticket frontmatter retaining READY if state ledger says REVIEW_REQUIRED.
6. Reviewer produces R5/R6-style immutable result.
7. Orchestrator applies review outcome to state.
8. Orchestrator continues to next admitted ticket.

### E2. Framework contradiction fixture

Create a synthetic broken package contract where recovery prose and transition registry conflict.

Expected:

- Orchestrator returns FRAMEWORK_CONTRACT_INCONSISTENCY.
- No package-managed framework file changes.
- No application file changes.
- No semantic project transition is fabricated.
- handoff is absent or invalidated.
- output tells user to repair/update YAAW.

### E3. Mid-dispatch framework drift fixture

Simulate:

1. framework integrity healthy;
2. role dispatch occurs;
3. a package-managed framework file changes unexpectedly;
4. Orchestrator re-enters.

Expected:

- integrity check catches drift before consuming semantic continuation;
- project execution stops;
- modified file is reported;
- no "repair it myself" action is routed.

---

## 11. Workstream F — installer repair for already-modified consumer installations

The affected consumer must be repairable without manual archaeology.

### F1. Add explicit conflict policy to headless repair

Current installer supports internal policies:

- fail
- keep
- replace
- backup-replace

Expose a supported CLI option, for example:

    --conflict-policy fail|keep|replace|backup-replace

Do not make users use --force-managed when they need preservation.

For incident recovery, documented command should use backup-replace.

Example intended UX after release:

    npx yaaw-se@next install --directory . --action repair --conflict-policy backup-replace --yes

Exact syntax may change during implementation, but the capability is mandatory.

### F2. Repair semantics

For package-managed files whose disk hash differs from the manifest:

- copy current file to .yaaw-core/install/backups/<timestamp>/<relative-path>;
- replace live package-managed file with the package version;
- update manifest hash;
- record backup metadata if practical.

For durable project files:

- do not overwrite;
- do not normalize content;
- do not rewrite merely because framework was tainted.

For runtime files:

- invalidate stale handoff/observed state after successful repair;
- allow Orchestrator to regenerate them.

### F3. Add framework-drift report to doctor/status

doctor should clearly group:

- modified package core files;
- missing package core files;
- legacy framework layout;
- durable project memory health;
- runtime cache status;
- recommended repair command.

Do not present framework modifications as harmless "local overrides" during normal consumer execution.

A package framework localOverride may remain technically supported for framework developers, but consumer doctor must mark it non-canonical / unsupported for autonomous execution unless an explicit development mode exists.

---

## 12. Workstream G — migrate the affected legacy .yaaw-core/system layout

The incident consumer uses an older/parallel layout under .yaaw-core/system.

The current distribution correctly considers that ambiguous. We need a safe migration path.

### G1. Migration decision matrix

Case A: valid old manifest proves package ownership of system/**
- migrate automatically during repair;
- backup modified managed files;
- install canonical layout;
- remove old managed system files after verification.

Case B: old manifest exists but some system files are locally modified
- backup-replace is required;
- never delete before backup;
- continue only after canonical framework verifies.

Case C: no valid manifest, but layout exactly matches a known released package fingerprint
- optional recognized legacy migration may adopt ownership using a release fingerprint table;
- produce an audit record;
- then migrate.

Case D: no valid manifest and framework ownership cannot be proven
- fail closed;
- do not delete system/**;
- provide exact manual recovery instructions;
- preserve project/**.

### G2. Migration order

1. Inventory current installation.
2. Capture installed version/manifest if available.
3. Capture current Git HEAD and dirty-state summary for diagnostics.
4. Compute package-managed file differences.
5. Backup all modified legacy package files.
6. Install new canonical package files to their final paths.
7. Verify canonical framework files.
8. Verify provider adapters.
9. Verify project durable memory still exists.
10. Remove obsolete package-owned legacy framework paths.
11. Remove empty legacy directories.
12. Invalidate runtime caches.
13. Commit new manifest last.
14. Run doctor.
15. Only then permit semantic Orchestrator execution.

Transaction rollback must restore pre-repair files if verification fails before manifest commit.

---

## 13. Workstream H — reconcile the affected consumer's project state after framework repair

Do not blindly roll back state.json to a pre-incident copy. Some incident-time state observations were valid.

### H1. Preserve historical evidence

Keep:

- prior R4 review;
- newly produced BLOCKED R5 review if it was written as an immutable historical review;
- verification evidence V3;
- ticket/spec/product/engineering artifacts;
- application code;
- Git history.

Historical review artifacts are evidence of what happened, even if the framework bug influenced the result.

### H2. Discard replaceable runtime coordination

After package repair:

- remove or invalidate old handoff.json;
- remove or regenerate observed-state.json;
- clear intent.json if its basis is stale.

### H3. Reconstruct TASK-001 from strongest evidence

Run Orchestrator under repaired canonical framework.

It should determine:

- current ticket/spec/product/engineering revisions;
- current repository identity;
- last valid implementation verification;
- prior review bases;
- whether source meaning changed.

For the incident shape where only repository identity drifted while source contract stayed current:

- old PASS is acceptance-stale;
- lifecycle should reconcile to REVIEW_REQUIRED;
- dispatch a fresh independent Reviewer with state access;
- fresh review produces the authoritative current acceptance result.

Do not trust the incident's self-edited framework as evidence.

### H4. Continue waiting tickets only after TASK-001 is re-established

TASK-002/TASK-003/TASK-005 or any dependent tickets must remain unadmitted until TASK-001 has a valid current acceptance state under repaired framework semantics.

---

## 14. Workstream I — installer/runtime handshake

Add a small explicit contract connecting package health to orchestration without giving Orchestrator installer authority.

Suggested states:

- INSTALLATION_HEALTHY
- FRAMEWORK_MODIFIED
- FRAMEWORK_MISSING
- LEGACY_LAYOUT
- MANIFEST_INVALID
- INSTALLATION_UNKNOWN

Orchestrator behavior:

INSTALLATION_HEALTHY:
- continue normal project inspection.

Any other state:
- stop semantic routing;
- emit typed framework blocker;
- recommend installer command;
- never rewrite managed files.

Installer behavior:
- repair package;
- verify;
- invalidate runtime cache;
- leave durable project semantics untouched.

This keeps authority clean:

    Orchestrator detects
    Installer repairs
    Orchestrator reconstructs

---

## 15. Workstream J — documentation and user-facing behavior

Update at least:

- README.md
- docs/distribution.md
- docs/integrations.md if provider bootstrap behavior changes
- docs/releasing.md if repair/migration is part of release smoke
- installer bootstrap templates
- .yaaw-core/README.md

Document:

1. Framework files are package-managed and not runtime-editable.
2. project/** is durable user/project memory.
3. runtime/** is replaceable.
4. What FRAMEWORK_INTEGRITY_VIOLATION means.
5. How to run doctor.
6. How to run backup-and-replace repair.
7. How affected legacy/system installs are migrated.
8. How to inspect backups.
9. That immutable review history is preserved.
10. That repair never means deleting project memory.

---

## 16. Tests required before merge

### 16.1 Python/core contract tests

Add or extend tests covering:

- role write allowlists;
- Reviewer state read;
- Orchestrator package write prohibition;
- workflow/read contract agreement;
- review result -> state transition agreement;
- recovery transition completeness;
- framework-integrity routing stop;
- legacy layout rejection by runtime.

### 16.2 Behavioral oracle tests

Add incident-derived scenarios:

- stale PASS due only to repository drift;
- source-current stale review -> REVIEW_REQUIRED;
- source-stale PASS -> REPLAN_REQUIRED;
- READY ticket metadata + REVIEW_REQUIRED state -> valid review;
- Reviewer PASS -> immutable review then Orchestrator state mutation;
- framework contract contradiction -> typed stop, zero framework edits.

### 16.3 Node installer tests

Add tests for:

- --conflict-policy backup-replace;
- modified package core backup + replacement;
- durable project byte-for-byte preservation;
- runtime invalidation after repair;
- old manifest managed system/** migration;
- locally modified old system/** backup before removal;
- invalid/unknown ownership fail-closed;
- transactional rollback;
- Windows path handling;
- spaces/Unicode project paths.

### 16.4 Tarball smoke tests

Extend smoke_npm_update.mjs or add a dedicated incident repair smoke:

1. install older synthetic package;
2. create durable project sentinels;
3. modify package-managed framework files exactly like the incident;
4. optionally create legacy system layout;
5. create review/evidence/state runtime artifacts;
6. update to repaired tarball with backup-replace;
7. assert canonical package files restored;
8. assert old modified framework is backed up;
9. assert project sentinels byte-identical;
10. assert stale runtime handoff is invalidated;
11. run doctor -> healthy;
12. run behavioral continuation fixture -> fresh review route.

---

## 17. Acceptance criteria

The fix is accepted only when all statements below are demonstrably true.

### Framework boundary

- A consumer Orchestrator cannot legitimately resolve a blocker by editing package-managed framework files.
- Framework drift is detected before semantic routing.
- Framework contradictions produce a typed stop.
- Orchestrator write authority remains limited to state/runtime coordination.

### Reviewer lifecycle

- Reviewer can read current lifecycle state.
- Reviewer does not use ticket frontmatter as the authoritative lifecycle ledger.
- Reviewer cannot write state.json.
- Reviewer owns semantic acceptance outcome.
- Orchestrator applies only the exact transition authorized by the immutable review result.

### Recovery

- Source-current stale PASS caused by repository/review/verification drift routes to REVIEW_REQUIRED.
- Source/contract stale PASS routes to REPLAN_REQUIRED.
- Recovery prose and transition registry cannot diverge unnoticed.

### Installer

- Modified framework files are discoverable by doctor.
- backup-replace repair preserves their previous bytes in installer backup storage.
- canonical framework is restored from package.
- project/** remains preserved.
- runtime caches may be safely reset.
- legacy system layout has a deterministic migration/fail-closed path.

### Incident consumer

- all package-managed framework mutations from the incident are either backed up then replaced or proven already canonical;
- no legitimate application/project artifacts are erased;
- historical reviews/evidence remain available;
- state is reconstructed from canonical evidence;
- TASK-001 receives a fresh valid review if required;
- orchestration can continue without framework self-editing.

---

## 18. Implementation sequence

Implement in this exact order to avoid building later work on ambiguous contracts.

### Phase 1 — lock semantics

1. Add framework-integrity rule.
2. Clarify installer vs Orchestrator authority.
3. Fix Reviewer state read contract.
4. Fix review-ticket preconditions.
5. Fix record-review vs state-writer semantics.
6. Clarify transition registry owner meaning.
7. Lock PASS recovery rules.
8. Add typed framework failure taxonomy.

Exit criterion:
- prose/registry/role ownership is internally coherent before writing runtime tooling.

### Phase 2 — static validation

1. Add cross-contract validators.
2. Add invalid fixtures.
3. Make current repository fail tests until all contradictions are resolved.
4. Ensure no workflow has undeclared reads/writes.

Exit criterion:
- the exact incident contract inconsistencies would be rejected in CI.

### Phase 3 — runtime integrity detection

1. Add framework-integrity tool.
2. Add Orchestrator pre-routing integrity gate.
3. Add post-dispatch re-entry integrity gate.
4. Add typed blocker output.
5. Ensure no automatic semantic state transition is made on framework failure.

Exit criterion:
- modifying a framework file during a fixture run stops orchestration without rewriting it.

### Phase 4 — installer repair UX

1. Expose conflict policy in CLI.
2. Improve doctor grouping.
3. Add backup-replace repair path.
4. Invalidate runtime caches after framework replacement.
5. Add audit-friendly output listing backups and replaced files.

Exit criterion:
- a tainted current-layout installation can be safely repaired headlessly.

### Phase 5 — legacy system migration

1. Implement ownership/fingerprint detection.
2. Add legacy migration planning.
3. Backup modified system files.
4. Install canonical layout.
5. Remove obsolete managed layout only after verification.
6. Commit manifest last.

Exit criterion:
- the affected consumer's layout class can be migrated or safely refused without project-memory loss.

### Phase 6 — incident behavioral regression

1. Add stale-PASS scenario.
2. Add Reviewer state/frontmatter scenario.
3. Add framework contradiction scenario.
4. Add full repair-then-resume scenario.

Exit criterion:
- the reproduced incident completes with a fresh review and no framework self-modification.

### Phase 7 — docs and release

1. Update docs.
2. Run full validation matrix.
3. Build npm tarball.
4. Run update/repair smoke tests.
5. Publish yaaw-SEv2 prerelease to next.
6. Repair the affected consumer using prerelease.
7. Validate its project state.
8. Observe at least one clean Orchestrator continuation.
9. Merge/promote implementation to main.
10. Prepare stable release when confidence is sufficient.

---

## 19. Affected-consumer recovery runbook after implementation

This section is the intended operator procedure once the code above exists.

### Step 1 — freeze autonomous execution

Do not run the old Orchestrator again before repair.

### Step 2 — capture diagnostics

Capture:

- git status
- git HEAD
- npx yaaw-se doctor output if available
- current manifest
- list of modified package-managed files
- current .yaaw-core/project/**
- current .yaaw-core/runtime/**

### Step 3 — run dry repair plan

Run repaired CLI in dry-run mode with backup-replace selected.

Review that:

- framework files are replaced;
- old framework modifications are backed up;
- project/** has no destructive operations;
- runtime cache invalidation is expected;
- legacy system paths are migrated/removed only as package-owned content.

### Step 4 — execute repair

Execute transactional repair.

### Step 5 — verify installation

doctor must report:

- manifest valid;
- managed framework healthy;
- no legacy parallel system layout;
- project memory present;
- path registry canonical.

### Step 6 — inspect backup

Confirm the incident-edited framework files exist in installer backups for forensic comparison.

### Step 7 — resume Orchestrator

The first repaired Orchestrator run must:

- reconstruct repository identity;
- ignore stale runtime handoff;
- preserve historical project reviews/evidence;
- reconcile TASK-001 from source/repository/review evidence;
- route to fresh review when acceptance is stale.

### Step 8 — verify clean continuation

After Reviewer returns:

- new immutable review round exists;
- state transition provenance is written by Orchestrator;
- no package-managed framework file hash changed;
- next ticket is routed only if dependencies permit.

---

## 20. Explicit non-goals

Do not solve this by:

- disabling autonomous orchestration;
- allowing Orchestrator to invoke installer writes automatically without user/package authority;
- deleting all project state and starting over;
- treating every repository drift as REPLAN_REQUIRED;
- making Reviewer a state-file owner;
- making ticket frontmatter lifecycle mutable across every transition;
- hiding local framework edits as harmless overrides;
- blanket-deleting .yaaw-core;
- trusting chat transcript as migration truth;
- overwriting historical review artifacts.

---

## 21. Security/trust rationale

The core trust model after this change should be:

    package defines governing execution contracts
    project artifacts record semantic work
    runtime coordinates disposable execution
    repository/evidence proves implementation reality
    reviewer decides acceptance
    orchestrator applies authorized state and routes next work
    installer alone repairs package-owned framework

This prevents a self-justifying execution loop where the same runtime can weaken the rules that constrain it.

The design remains autonomous, but autonomy operates inside immutable package boundaries.

---

## 22. Promotion gate from yaaw-SEv2 to main

Do not promote implementation merely because unit tests pass.

Required promotion evidence:

- all Python validators green;
- all Python tests green;
- npm test green;
- npm build green;
- package dry-run contents correct;
- tarball smoke green;
- tarball update smoke green;
- new framework-drift repair smoke green;
- Windows smoke green;
- macOS smoke green;
- incident fixture green;
- current-layout tainted install repair green;
- legacy system-layout repair or fail-closed fixture green;
- durable project sentinels byte-identical across repair;
- no package-managed framework file changes during post-repair Orchestrator continuation.

Only then should the implementation be merged/promoted to main.

---

## 23. Definition of done

This incident is considered fully resolved when:

1. yaaw-SE can detect its own installed framework drift but cannot treat self-editing as a valid recovery strategy.
2. Reviewer lifecycle authority is unambiguous and mechanically consistent with role I/O.
3. PASS recovery is cause-aware and machine-valid.
4. CI catches the contract contradictions that caused the incident.
5. Installer can backup-and-replace tainted package-managed framework files.
6. Legacy .yaaw-core/system installations have a supported migration or a safe refusal path.
7. The affected consumer can be repaired without losing durable project state.
8. Its historical project evidence remains intact.
9. A fresh Reviewer can re-establish current TASK-001 acceptance.
10. Orchestrator can continue autonomously afterward while framework hashes remain unchanged.
