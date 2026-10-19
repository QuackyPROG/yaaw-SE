# YAAW-SE v3 — PRD foundation

A clean v3 branch for YAAW-SE, beginning with an independent, product-only interview workflow. **This is an implemented PRD workflow foundation, not a full autonomous coding system.** The Planner → Implementer → Reviewer → Orchestrator loop belongs to later slices.

## Core principle

**Product intent is interviewed, persisted, checked, and re-evaluated after every batch.** Product meaning survives context limits because accepted requirements and their source answers are stored on disk, not in chat.

## Start the PRD

1. Read `AGENTS.md` and invoke `skills/yaaw-prd/SKILL.md` in your coding agent.
2. Initialize a target project: `node scripts/prd.mjs init --workspace /path/to/project`.
3. The PRD skill drafts a `questions.json` batch with **1–10** short questions in A/B/C form and a recommendation. Validate and persist: `node scripts/prd.mjs prepare --workspace /path/to/project --questions questions.json`.
4. Ask the human. Preserve the *verbatim* answer in `answers.md`: `node scripts/prd.mjs capture --workspace /path/to/project --answers answers.md`.
5. The PRD interpreter writes `proposal.json` (only supported conclusions); run `node scripts/prd.mjs fingerprint --workspace /path/to/project --proposal proposal.json` for review hashes. A fresh semantic critic writes `review.json` using the current ledger, unedited answers, and exact proposal. The critic must examine conflicts and drift, not merely approve.
6. Gate acceptance: `node scripts/prd.mjs commit --workspace /path/to/project --proposal proposal.json --review review.json`. This updates the decision ledger and regenerates the readable `product.md`.
7. Re-inspect the PRD, identify remaining product questions, and repeat. Check projection integrity with `node scripts/prd.mjs audit --workspace /path/to/project`. After all material questions are resolved, run `node scripts/prd.mjs finalize --workspace /path/to/project`.

All commands use built-in Node.js APIs. Node.js 20+ is recommended.

## Hook boundaries

| Workflow hook | Trigger | Enforced action |
| --- | --- | --- |
| Pre-question | `prepare` | Validate 1–10 questions, A/B/C choices, recommendation, section, and no pending batch |
| Post-answer | `capture` | Preserve raw input and its hash |
| Pre-commit | `commit` | Require full interpretation/deferral coverage, exact user quote, reviewer PASS tied to proposal/answers/context hashes, no silent overwrites |
| Post-commit | `commit` | Persist append-only interview audit bundle and regenerate `product.md`; skill must re-read result |
| Readiness | `finalize` | Reject unfinished batch, unresolved questions or required empty sections |

**Important:** These are executable, explicitly invoked **workflow hooks**, not provider-native event hooks. Native Codex/Claude adapters are intentionally not installed yet. A content hash does not detect every semantic contradiction; an independent semantic review is part of the protocol and unresolved human intent must be clarified.

## Layout

```text
AGENTS.md                  Repository instructions for v3
skills/yaaw-prd/SKILL.md   Public PRD skill entrypoint
.yaaw-core/prd/            Canonical product workflow, sections and hooks
scripts/prd.mjs            Deterministic interview transaction gate
tests/prd.test.mjs         Test suite
```

Target projects receive `.yaaw-core/project/product.md`, `.yaaw-core/project/prd/ledger.json`, `.yaaw-core/project/prd/state.json`, and verbatim round evidence.

## Scope

Included: independent PRD initiation, sectional interviewing, staged question/answer rounds, audit-ready proposals, source checking, optional fresh-context semantic critic enforced at commit, conflict rejection, readable PRD projection, basic readiness gate.

Not yet included: native provider hook adapters, autonomous multi-context launching, PRD revision approval workflow, lifecycle of planner/implementer/reviewer/orchestrator, installation packaging or release. Do not mistake skill prose for background automation.
