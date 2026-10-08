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
