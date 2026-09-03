# Observability and Harness Evals

Autonomy claims must be supported by evidence. yaaw-SE therefore separates two feedback layers:

1. **deterministic conformance evals** prove generic control invariants; and
2. **ephemeral runtime metrics** expose how the agentic workflow behaves in practice.

## Conformance suite

`evals/scenarios.json` exercises known failure classes: incorrect routing, unsafe command classification, repository prompt injection, retry loops, unauthorized artifact mutation, scope escape, graph corruption, illegal history rewrites, and stale/failing verification evidence.

CI runs the suite on every push and pull request. A newly discovered harness escape should become a regression scenario before it is considered repaired.

## Runtime metrics

Runtime events may carry optional `tokens`, `cost_usd`, and `duration_ms` fields. `scripts/report_metrics.py` summarizes event counts, QA pass rate, total tokens, approximate provider cost, and duration. These metrics belong in `.yaaw/runtime/` or an external telemetry system, not in Git by default.

Projects should additionally measure domain outcomes such as route corrections, PLAN_DELTA rate, scope deviations, QA repair rate, escaped defects, human intervention reasons, and recovery events. Metrics diagnose the workflow; they must not silently become product requirements or approval gates without an explicit policy decision.
