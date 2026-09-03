# Harness Evaluations

`evals/scenarios.json` is the deterministic adversarial conformance suite for generic yaaw-SE invariants. These are not application tests and they are not benchmark theater: each scenario encodes a failure mode the harness must prevent or classify correctly.

Covered boundaries include routing calibration, security command classification, prompt-injection trust, bounded retries, field-level authority, scope escape, graph cycles/missing blockers/frontier computation, long-horizon graph scale, immutable completed history, transition admission, and stale/failing evidence.

Run:

```text
python scripts/run_evals.py
```

Optional machine report:

```text
python scripts/run_evals.py --report .yaaw/runtime/eval-report.json
```

The report is runtime evidence, not durable product truth. Add a scenario whenever a harness bug escapes CI or a new deterministic invariant is introduced. Do not replace real project/domain tests with these generic scenarios.
