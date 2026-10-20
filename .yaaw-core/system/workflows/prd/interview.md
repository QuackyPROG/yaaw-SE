# PRD interview — single public skill

Read `AGENTS.md` and `SYSTEM.md` first. Use the consumer project workspace, not the framework root unless that is actually the target project.

## User-facing protocol

1. Invoke `node bin/yaaw-prd.mjs start --workspace <root>`. If no product exists, the engine creates it without overwriting existing documents and opens Q0: “What are you trying to build? Explain your idea in your own words. Focus on what the product should do and what people should experience.”
2. Present questions returned as `AWAIT_ANSWERS`. Later batches have 1–10 concise questions (usually 3–6) with A/B/C and a recommendation. Accept free-form responses; never assume the recommendation was selected.
3. Preserve the exact user responses in a temporary JSON file keyed by the returned question IDs, then invoke `submit` once. The engine saves original answers to `rounds/NNNN.json` before invoking workers.
4. Fresh `DISCOVERY` Codex SDK thread interprets the answers, makes cited proposals, and stages them NOT ACCEPTED. Fresh, separate `AUDIT` thread compares proposals with exact input and accepted history. The engine validates the review basis, role identities, replacements, and current revision. PASS commits; CLARIFY asks focused follow-up; REJECT returns to interpretation; BLOCKED fails closed.
5. After PASS/CLARIFY, a new Discovery context selects the next frontier. When it considers the PRD complete, a new full-product READINESS context evaluates eight sections and unresolved material product issues. The engine alone marks READY.
6. Run `continue` after interruptions. Recovery reconstructs staged work and completes a durable, already-authorized COMMIT_PENDING journal without repeating a model review. Keep the main user-facing conversation; never manually renew/clear it or require another skill invocation.

## Codex execution and evidence

The adapter uses the official `@openai/codex-sdk` with `Codex.startThread` for each worker, `sandboxMode: read-only`, `approvalPolicy: never`, and `networkAccessEnabled: false`. It never uses `resumeThread` for worker contexts. Each model output must match its machine-readable contract; worker thread IDs and immutable answer/proposal/review metadata are recorded for audit. The SDK and Codex authentication are necessary for autonomous inference. Mock tests are not real Codex isolation evidence. Provider-native hooks are not installed or required.

The accepted PRD is `.yaaw-core/project/product.md`; round records are `.yaaw-core/project/prd/rounds/`. Do not duplicate accepted product meaning in caches or conversation summaries. Planner owns engineering decisions. Semantic review is fallible; the code only proves gates, integrity, identity, and provenance, not user intent itself.
