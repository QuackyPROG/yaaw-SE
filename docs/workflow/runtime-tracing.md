# Runtime tracing

yaaw-SE runtime tracing is append-only evidence emitted by the executable gateway. It is diagnostic and auditable, but never a source of product intent or workflow authority.

## Correlation model

A runtime trace uses:

- `run_id` — one logical agent/evaluation run;
- `trace_id` — one correlated execution trace within that run;
- `span_id` — one gateway/action event;
- `parent_span_id` — optional causal link from an action result/error back to its start span.

`TraceContext` generates correlation identifiers. `RuntimeGateway.from_repository(...)` enables tracing by default at `.yaaw/runtime/events.jsonl`; callers may override or disable that path explicitly.

## Gateway lifecycle

The gateway emits:

- `GATEWAY_ALLOWED` after policy inspection and, when required, successful controller reservation;
- `GATEWAY_DENIED` for policy/controller denial before a provider/OS runner is invoked;
- `ACTION_START` immediately before the injected runner;
- `ACTION_RESULT` on successful return;
- `ACTION_ERROR` on an exception.

All persisted string values are recursively passed through secret redaction before the JSONL record is written. Correlated events are rejected when only a partial `run_id`/`trace_id`/`span_id` tuple is present.

## Metrics

`scripts/report_metrics.py` derives counters from the event stream, including gateway allow/deny counts, action failures, unique runs/traces, QA pass rate, tokens, cost, duration, plan churn, scope drift, QA escapes, human interventions and repeated failure signatures.

Metrics diagnose behavior; they do not approve plans, change tickets, waive QA, or grant semantic authority.

## Durability boundary

`.yaaw/runtime/events.jsonl` is ephemeral runtime evidence. Claims that matter across sessions must be promoted into the registered durable evidence/ticket artifacts with source fingerprints. Secret values must never be copied from traces into durable artifacts.
