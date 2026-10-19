# YAAW-SE v3 — PRD-first clean foundation

**Status: experimental PRD engine, not a complete autonomous engineering framework and not an npm release.** This branch is built as a new working tree rather than a modification to v2. `main` and `yaaw-SEv2` are unchanged.

## Model

`PRD (independent) → Planner → Spec → Tickets → Implementer → Reviewer → repeat`, with an Orchestrator reconstructing artifact truth and choosing the next admissible step. Only the **PRD transaction engine** is executable in this first v3 slice; downstream roles are design contracts for subsequent work.

## PRD workflow

The agent interviews in topical rounds. Each question is short with A/B/C plus a recommendation, but any free-form answer is valid. The AI interprets the answers and writes **pending interpretations** into `product.md`. A semantic reviewer checks the interpretations against past accepted requirements and actual answers. A PASS commits accepted product meaning into the relevant section; CLARIFY rejects the staging and starts targeted follow-ups. Accepted product requirements have stable identifiers and source-question provenance.

**Internal pre/post hooks are implemented as CLI state-transition gates**. No native Codex/Claude/Gemini hook has been installed yet, and the CLI does not invent answers or call a language model. When invoked inside a compatible coding agent, `skills/yaaw-prd/SKILL.md` directs the agent to operate the loop.

## Try it locally

Requirements: Node.js 20 or newer. No npm install necessary.

```bash
npm test
node bin/yaaw-prd.mjs init --workspace /path/to/my-project
node bin/yaaw-prd.mjs status --workspace /path/to/my-project
node bin/yaaw-prd.mjs batch examples/batch.json --workspace /path/to/my-project
node bin/yaaw-prd.mjs answer examples/answers.json --workspace /path/to/my-project
node bin/yaaw-prd.mjs propose examples/proposals.json --workspace /path/to/my-project
# Copy the reviewBasis value returned by propose into review.json.
node bin/yaaw-prd.mjs review review.json --workspace /path/to/my-project
```

Templates and exact formats: `examples/`; semantic workflow: `.yaaw-core/system/workflows/prd/interview.md`.

## Safety invariants

- Durable artifacts, not the chat window, are the source of accepted meaning.
- An unanswered or unreviewed batch blocks the next batch.
- Candidates are **not** requirements until reviewed.
- Review basis hashes block stale approvals, and replacement of accepted requirements requires an explicitly authorized replacement.
- Semantic contradiction detection requires reviewer judgment; string checks are not a substitute.
- Product requirements describe people, journeys, features, constraints and outcomes — not unrequested technical implementation.
- Do not use this prototype as `npx yaaw-se install`; the v3 packaging, orchestration and provider integration are not yet implemented.
