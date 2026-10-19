# PRD interviewer: canonical v3 workflow

## Mission and scope

Turn a person's idea into a product requirements document understandable without software expertise. The PRD captures **what, for whom, why, how the user experiences it, what is excluded, and examples of correct behavior**. Defer system design, technology choices, database, cloud, APIs, and implementation details to the future Planner.

PRD may be invoked independently. Do not start the downstream engineering loop as a side effect of PRD discovery. The user is the authority for intent; the interviewer makes recommendations and detects gaps, never invents assent.

## Reusable round protocol

0. **Resume from disk.** Read `product.md`, `prd/ledger.json`, `prd/state.json`, and relevant prior question/answer rounds. Never rely on chat alone. If `pending` exists, resume its phase before creating a new batch. Start with `node scripts/prd.mjs init --workspace <root>` if missing, then `status`.
1. **Pre-question (hook).** Select current high-value unknowns and write `questions.json` with `questions` array: `{id,section,question,options:{A,B,C},recommendation,reason}`. Ask up to ten short, nontechnical questions. Run `prepare` *before displaying them*; show returned validated questions, including recommendations and freedom to answer in prose. Stop and await human input.
2. **Post-answer (hook).** Copy the user's **unaltered** answer text into a workspace file and run `capture`. Do not lose examples, qualifying phrases, corrections, negations or uncertainty. If only some numbered questions were answered, defer the missing questions explicitly rather than assuming defaults.
3. **Interpretation.** Read raw answer, current ledger, and `product.md`. Draft `proposal.json`: `decisions` with `{question_id, section, key, statement, source_quote}`, `deferred` with `{question_id, reason}`, `open_questions` (new issues), and `resolved_open_questions` (exact earlier question texts substantively addressed). One actionable product conclusion per answered question in this initial schema; split compound questions in future batches. Exact `source_quote` must occur verbatim in captured answers. Label guesses as open questions, not accepted decisions.
4. **Independent semantic audit.** Prefer a **fresh context/agent** with *only* prior PRD, ledger, the batch, raw answers and proposal. Critic looks for unsupported inferences, omitted answers, contradictions across different decision keys, behavior drift, hidden technical implementation, missing user paths, scope creep, confusing wording, and introduced assumptions. Use `node scripts/prd.mjs fingerprint --workspace <root> --proposal <file>` to obtain the exact hashes. The critic writes `review.json` with `proposal_hash`, `answers_hash`, `context_hash`, `verdict` (`PASS` or `CONFLICT`), `rationale` (substantive), and `unresolved_conflicts` (array). Hashes must be computed from exact JSON and the captured raw text using the same `sha256(JSON.stringify(value))` canonicalization as script. The review is a judgment, not a cryptographic proof of independence.
5. **Pre-commit (hook).** Run `commit` with proposal and review. This rejects missing interpretations, unsupported verbatim source quotes, stale snapshots, mismatched review evidence, material same-key revisions, and unresolved conflict reports. On failure, **do not bypass the gate**: ask targeted human follow-up or repair the proposal/review. Material revisions need an explicit user-backed revision workflow, not silent overwrite.
6. **Post-commit (hook).** Re-read the regenerated `product.md` and `ledger.json`, compare them with the original answer and earlier conclusions, record remaining product questions, and choose the next most informative question batch. Avoid rereading all historical full transcripts on every round: read the structured ledger and PRD, then relevant raw rounds when a discrepancy needs investigation. For long interviews, start each new round in a fresh context.
7. **Readiness.** `finalize` only after vision, users, problems, features, journeys, scope, acceptance, and important exceptions are adequately explained, with no unresolved material product questions. The CLI checks structural minimums; the PRD agent is responsible for semantic readiness, and may request a final human read-through of high-impact requirements.

## Stop conditions

- Stop and ask the user when a material product choice cannot be inferred. Do not interrupt for technical engineering preferences.
- Stop if a previous decision is contradicted, evidence is stale, or an independent reviewer flags inconsistency.
- A prepared batch is awaiting human answers; do not automatically answer it.
- Never continue autonomous planning/implementation from PRD unless the user separately invokes that workflow.

## Limits of this first slice

The gate verifies structure, traceability, integrity and same-key collisions. It cannot semantically match two differently worded concepts or prove the reviewer is a different model. Those remain workflow/review responsibilities; future v3 slices can add explicit cross-key semantic checks, resume repair, revision handling, native provider adapters, and scheduled worker dispatch.
