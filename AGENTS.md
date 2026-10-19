# YAAW-SE v3 repository contract

This is the **authoritative repository instruction file** for work on `yaaw-SEv3`. Before inspecting, editing, reviewing, or pushing this branch, read this file and the specific `.yaaw-core` workflow being changed. Do not assume v2 rules govern v3. Preserve `main` and `yaaw-SEv2` unless the user explicitly directs otherwise.

## v3 architecture and authority

- This branch is a **clean v3 redesign**, intentionally starting with the PRD vertical slice, not a copy of v2. Do not implement Planner, Implementer, Reviewer, or Orchestrator until the user requests the next slice.
- Public Agent Skills are thin entrypoints under `skills/`; canonical workflow contracts and rules belong in `.yaaw-core/`. Do not duplicate complex procedures in skills.
- PRD is independently invocable, and owns **product meaning** only: audience, problems, expected behaviors, user journeys, feature outcomes, exclusions, and acceptance. **No solution architecture, stack, database, framework, or infrastructure choice belongs in the PRD**, except an explicit user-specified product constraint.
- Agents are disposable; accepted decisions, original user answers, and audit evidence persist in project files. A chat transcript is not a source of truth.
- All required work is staged into small, verifiable transactions. A model's claim that it ran a check is not evidence.
- `.yaaw-core/prd/WORKFLOW.md`, `.yaaw-core/prd/SECTIONS.md`, and `.yaaw-core/prd/HOOKS.md` govern product interviews. The concrete transaction gate is `scripts/prd.mjs`.
- Runtime product memory is `.yaaw-core/project/` in an installed target workspace. Within it, `product.md` is the readable projection, `prd/ledger.json` is the structured decision record, and `prd/rounds/` holds the original interview evidence.
- No model may silently rewrite a previously recorded product decision. A conflict requires targeted clarification and an explicit revision procedure (not implemented in this initial slice).

## Interview protocol

1. Read existing product state before asking anything; avoid repeat questions.
2. Ask **1–10 brief high-value questions** per batch, always with A/B/C, a concise reasoned recommendation, and an explicit free-form option.
3. Capture the user's *unaltered* response. Interpret it into product-level decision proposals with exact source quotations and stable keys; separate assumptions and open questions.
4. Use a fresh, independent semantic review context where available. Compare new interpretations against the original user answers, previous decisions, and the PRD; check contradictions, edge cases, accidental narrowing, invented requirements, and wording drift.
5. Only commit a reviewed proposal using the deterministic PRD gate. The CLI checks coverage, source anchoring, revision conflicts, and matching hashes. It cannot judge truth or semantic equivalence; the reviewer remains necessary.
6. Re-read the persisted PRD before generating the next batch; ask only newly discovered or unresolved product questions.
7. Mark READY only if necessary product sections are defined, open questions are resolved, and the document is comprehensible to a fresh non-engineer.

## Hooks and provider compatibility

- v3 defines **workflow hooks** as CLI stages: pre-question, post-answer, pre-commit, post-commit, and readiness. They run when invoked via the script/skill, **not automatically on every model message**.
- Do not claim model-agnostic native hook enforcement. Native hooks vary by provider and require separate tested adapters and trust configuration. Do not install host hooks or global settings without user approval.
- A source quote/hash check catches misattribution or stale proposals; it is **not** independent semantic assurance. Phrase checks and fixed question counts are never substitutes for reasoning.

## Engineering discipline

- Write small, dependency-free code. Every new gate must have tests for valid paths, rejected invalid inputs, conflict handling, and recovery behavior.
- Avoid modifying upstream branches. Target `yaaw-SEv3` for all v3 changes.
- Verify scripts with `node --test tests/*.test.mjs` and `node --check scripts/prd.mjs` before pushing.
- Report precisely which claims are enforced by code, which rely on model instructions, and which need human review. Never claim an unimplemented native hook or CI integration is active.
