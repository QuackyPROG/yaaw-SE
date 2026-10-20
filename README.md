# YAAW-SE v3 — autonomous PRD foundation

**Status:** experimental PRD runtime, not a published npm package or a complete autonomous software-engineering framework. This branch does not merge into `main` or `yaaw-SEv2`.

## Architecture

One public skill (`skills/yaaw-prd/SKILL.md`) → one user-facing Codex PRD coordinator → new read-only Discovery/Audit worker threads via official Codex SDK → deterministic checkpoint engine → durable `.yaaw-core/project/product.md`. Workers are disposed after each task; no worker history is resumed. The user answers only product questions.

- `src/prd-session.mjs`: run-to-input coordinator; emits questions or a specific blocker.
- `src/codex-worker.mjs`: fresh SDK `Codex.startThread()` for every Discovery, Audit, and readiness task, with reported execution identity. The SDK is dynamically loaded.
- `src/prd-engine.mjs`: only accepted document writer, provenance, revision and proposal gates, idempotent commit journal, deterministic partial-write recovery and local writer lock.
- `bin/yaaw-prd.mjs`: CLI for starting/resuming the same skill workflow.
- `.yaaw-core/system/workflows/prd/interview.md`: host coordinator behavior.

The accepted PRD belongs to the *consumer* workspace, not to a disposable agent. Original answers, question IDs, proposal bases, review findings and worker IDs are durably kept in `rounds/NNNN.json`.

## Requirements

Node.js 20+ and, for **actual AI-powered interviewing**, the official Codex SDK and authenticated local Codex runtime:

```bash
npm install @openai/codex-sdk
# Authenticate Codex using the supported client sign-in mechanism.
```

YAAW itself is not published to npm. SDK is not required for deterministic engine tests. If missing, worker execution fails closed rather than treating model-generated text or mock results as genuine Codex evidence.

## Usage inside Codex

Invoke **`yaaw-prd` once**. The host coordinator runs the CLI for you.

For troubleshooting/manual use:

```bash
node bin/yaaw-prd.mjs start --workspace /path/to/consumer-project
# -> Q0 open-ended product question

# Store the actual response with its question ID:
printf '{"answers":{"Q0":"A personal expense tracker."}}\n' > /tmp/answers.json
node bin/yaaw-prd.mjs submit /tmp/answers.json --workspace /path/to/consumer-project
# -> next question batch, READY, or specific BLOCKED reason

node bin/yaaw-prd.mjs status --workspace /path/to/consumer-project
node bin/yaaw-prd.mjs continue --workspace /path/to/consumer-project
node bin/yaaw-prd.mjs recover --workspace /path/to/consumer-project
```

`start` preserves existing product state and asks one open-ended product question on first use. Later questions are usually 3–6, maximum 10, with A/B/C choices and a recommendation that the user need not accept. Answers are saved before interpretation. After each accepted checkpoint, a fresh Discovery worker chooses the next questions. Before READY, a separate readiness worker reviews all eight sections. The process pauses for user decisions, unrecoverable review findings, or runtime blockers.

Low-level CLI operations (`batch`, `answer`, `propose`, `review`, `finalize`) remain for testing/backward compatibility; they **do not** establish live Codex isolation or semantic correctness by themselves.

## Validation

```bash
npm test
node --check src/prd-engine.mjs
node --check src/prd-session.mjs
node --check src/codex-worker.mjs
node --check bin/yaaw-prd.mjs
node bin/yaaw-prd.mjs start --workspace "$(mktemp -d)"
```

The test suite includes a scripted mock worker flow, explicit correction/replacement, unsupported inference rejection, refusal/clarification, interrupted staging, post-journal commit recovery, and read-only SDK thread-construction checks. These tests **do not** prove actual Codex authentication, model correctness or real thread isolation; those require a credentialed integration run on an installed Codex host.

## Deliberate limitations

- The visible parent conversation remains the host's session; this branch does not silently reset the parent thread.
- The SDK creates new thread identities and supplies a bounded evidence package. Model semantic judgment is not mathematically proven by unique IDs.
- The local lock is for cooperative processes on a local filesystem, not a distributed transaction mechanism.
- Native Codex hooks exist in recent clients, but v3 uses no native hooks; its gates remain correct without hook delivery.
- No global Codex setting changes, trust bypasses, autonomous Planner/Implementer/Reviewer runtime, or npm publishing.
- Installations without Codex SDK/credentials can use deterministic commands and tests but cannot run autonomous inference.
