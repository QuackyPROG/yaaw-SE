# Quality, retrieval and artifact lifecycle

`HARDEN-17` makes quality signals addressable without turning metrics or retrieval systems into product authority.

## QA identities

A QA finding gets a deterministic `QA-<ticket>-<signature>` identity derived from normalized severity + summary. The same finding retains its identity across repair cycles; a finding absent from the next cycle is marked resolved instead of disappearing from history. Residual risk uses `RR-<ticket>-<signature>` identity so release/integration decisions can reference a concrete unresolved risk.

Failure signatures are normalized separately from QA IDs. Repeated identical signatures are both bounded by controller policy and countable as livelock pressure.

## Planning lint

Policy lint rejects clearly non-observable acceptance such as `works correctly`, `implement backend`, or unbounded expected surfaces. This is intentionally conservative: software catches obvious slop while Planner/QA still judge whether a sophisticated criterion is actually sufficient.

## Retrieval hooks

The generic retrieval contract is ordered around intent, not implementation:

1. ownership;
2. repository map;
3. symbol/interface search;
4. relevant tests;
5. canonical docs/recent history.

A consuming runtime may implement those hooks with grep, an LSP, native code search, a graph index, or another provider. The hook registry is `EVIDENCE_ONLY`; retrieval can improve context but cannot change semantic authority.

## Stable-path archive/index

Structured artifacts keep stable paths and stable IDs. Indexes record `{id,path,schema,status,digest}`. Archival is a reference-only manifest over those identities; it does not move, delete or rewrite completed artifacts. This avoids breaking blocker/spec/ADR links merely because lifecycle status changed.

## Metrics

Append-only runtime events can measure plan churn (`PLAN_DELTA`), scope drift, QA escapes, human intervention, and repeated failure signatures in addition to cost/tokens/duration and QA pass rate. Metrics diagnose the harness; they do not redefine accepted product intent or automatically waive gates.
