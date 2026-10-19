# Hooks: precise execution model

The word **hook** in v3 means a checkpoint around a PRD workflow action, *not* a promise that any vendor automatically fires a handler on user messages.

| Hook | Exact checkpoint | Deterministic check | Judgment still required |
| --- | --- | --- | --- |
| `pre_question` | `prepare` | 1–10 distinct IDs, known sections, A/B/C, recommendation and reason, no pending round, ledger hash snapshot | Are these the most informative questions? |
| `post_answer` | `capture` | Preserve verbatim answer and hash, block unsupported phase | What did the user mean? |
| `pre_commit` | `commit` | Every question interpreted or deferred; source excerpt appears in response; semantic review has matching hashes/PASS; no same-key silent rewrite | Cross-key contradictions, meaningful scope change, latent assumptions |
| `post_commit` | `commit` + re-read | Persist proposal/review/ledger; derive human-readable PRD | Did the result fully preserve nuance? What to ask next? |
| `readiness` | `finalize` | No outstanding batch/open questions; structurally required sections present | Is the specification actually coherent and usable? |

## Failure and recovery

- If the phase fails, do not advance; keep raw answers and review evidence available for diagnosis.
- If a semantic contradiction is found, stop acceptance and raise a **small targeted clarification**, not a new generic questionnaire.
- Do not automatically mutate existing product decisions to resolve a contradiction.
- Because separate file writes cannot be a database transaction, check `status`, `ledger.json`, and `product.md` after interruptions. If they disagree, do not regenerate unverified new decisions. A future release must add explicit recovery tooling.

## Native provider adapters

There is **no native Codex/Claude/Gemini hook configuration in this first slice**. Native event names, permissions and installation differ. If adapters are later added, they should call the same transaction gate and include integration tests; a provider adapter must not become an independent source of PRD truth.
