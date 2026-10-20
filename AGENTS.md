# YAAW-SE v3 — authoritative repository instructions

Read this file **first** on every repository operation, followed by `.yaaw-core/system/SYSTEM.md` and only the active workflow. If the user changes these rules explicitly, resolve that instruction against host and safety constraints. Do not assume instructions or state from `main`, `yaaw-SEv2`, old chats, or other branches govern v3.

## Branch and change discipline
- The active experimental branch is `yaaw-SEv3`; do not modify `main` or `yaaw-SEv2` while doing v3 work.
- v3 is intentionally a clean new file tree; do not copy v2 installer/runtime by default. Reintroduce capabilities only when contracted and tested.
- Read the branch's own `AGENTS.md`, relevant core contract, and affected files **before** edits. Always identify current branch, diff, and untracked changes before writing.
- Never claim a complete engineering orchestrator or published npm release. Executable scope is the **autonomous PRD transaction when the Codex SDK and authentication are available**; downstream planning, implementation and review remain unshipped.
- Test changes to CLI, hooks, acceptance, recovery, and document rendering together. Run `npm test`, `node --check src/prd-engine.mjs`, and a CLI smoke before merging.

## Roles and authority
- **PRD**: owns product intent, user groups, needs, features, journeys, business rules, constraints, success measures. Uses plain language; no architecture choices by inference.
- **Planner**: future role; owns technical interpretation, architecture, specs, and tickets, never invents product intent.
- **Implementer**: future role; implements a bounded admitted ticket, never approves itself.
- **Reviewer**: independently evaluates semantic agreement and downstream changes. A deterministic validator never masquerades as a semantic reviewer.
- **Orchestrator**: future role; reconstructs durable reality and routes to exactly one valid operation, never resolves product disagreements unilaterally.

## Artifact ownership
- `skills/`: thin public invocation entrypoints. The PRD skill is `skills/yaaw-prd/SKILL.md`.
- `.yaaw-core/system/`: package/workflow instruction contract; no project decisions live here.
- `.yaaw-core/project/product.md`: canonical accepted product requirements, plus clearly labeled **unapproved** staging area.
- `.yaaw-core/project/prd/rounds/NNNN.json`: durable provenance for each question/answer/interpretation/review transaction. Avoid duplicating entire chat logs elsewhere.
- `.yaaw-core/project/prd/readiness.json`: signed-off readiness coverage; never treat the filename alone as proof of readiness.
- `.yaaw-core/runtime/`: replaceable caches only (not required for the PRD engine). Do not put accepted meaning here.
- Downstream product changes must invalidate engineering/spec/ticket bases once those layers are implemented.

## PRD lifecycle: enforce, don't merely suggest
1. Pre-question gate: 1–10 nonredundant, short questions, each with A/B/C options and one marked recommendation; user may answer freely or choose another option.
2. Post-answer gate: record exact answers with question ID and batch ID. Do not proceed to next batch until each answer is handled.
3. Interpretation: extract product statements into the PRD's **pending** area; cite the specific answered question(s). Never label them accepted before review.
4. Pre-acceptance gate: check prior accepted requirements, candidate interpretations, user answers, scope, edge cases, contradictions and drift. This is a **semantic reviewer** responsibility; the local code enforces structure, freshness and authority boundaries only.
5. Post-review gate: PASS promotes staged statements to accepted requirements with stable IDs and an incremented revision; CLARIFY removes staging, records the discrepancy, and requires a targeted follow-up batch.
6. Readiness gate: an independent reviewer checks all eight PRD sections, remaining ambiguity, outcomes, users, journeys, exclusions and acceptance criteria; machine validates the declared coverage.
7. Pause only when a **meaningful** product decision requires human authority. Missing implementation details go to Planner, not the PRD user.

## Hook boundaries
`before_batch`, `after_answer`, `before_propose`, `after_propose`, `before_review`, `after_review`, and `before_finalize` are real **internal CLI validation boundaries** implemented by `src/prd-engine.mjs` and called by `bin/yaaw-prd.mjs`. They are **not** claims of native Codex/Claude/Gemini host hooks. Wire provider-native hook adapters separately after verifying each provider's supported API.

## Non-negotiable behavioral guarantees
- Files, not transient chat context, carry accepted meaning and answer provenance.
- Never overwrite a pre-existing product file during initialization.
- A free-form answer overrides recommended multiple-choice defaults.
- Revisions to an existing requirement demand an explicit `replaceId` and independent review authorization, linked back to the human's instruction.
- A stale review basis fails closed; a review with findings cannot PASS.
- The engine cannot automatically infer semantic agreement from string equality. The skill must use a fresh review context where available, or disclose that independence is limited.
- Preserve human language for the PRD. Technical mechanisms and vendor choices belong in later engineering decisions unless explicitly required by the human as a product constraint.
- Do not optimize question count. Minimize unneeded questions; default to 3–6 high-impact questions and never exceed 10.

## Verification
From repository root:

```bash
npm test
node --check src/prd-engine.mjs
node bin/yaaw-prd.mjs init --workspace /path/to/a/new/project
node bin/yaaw-prd.mjs status --workspace /path/to/a/new/project
```

The code is a PRD-engine prototype, not a complete installable `yaaw-se` distribution. Do not publish it to npm before distribution and host-integrations are implemented and tested.

## Autonomous PRD runtime

The single public `yaaw-prd` entrypoint uses `start`, `submit`, `continue`, and `recover` commands. `src/prd-session.mjs` coordinates fresh read-only Codex SDK Discovery/Audit workers; `src/prd-engine.mjs` alone modifies the accepted PRD and validates checkpoint transitions, durable source evidence, worker identities, journals, and recovery. `@openai/codex-sdk` is an explicit local install prerequisite for live inference. Native Codex hooks remain uninstalled; do not rely on them as the controller. The manual `batch`, `answer`, `propose`, `review`, and `finalize` commands remain for backward compatibility/testing, not proof of independent semantic correctness. Mock tests are not real Codex integration tests. Never assume the parent thread can be renewed invisibly.
