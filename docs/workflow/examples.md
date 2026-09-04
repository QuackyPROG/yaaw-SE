# Executable workflow examples

Examples live under `examples/workflow/` and are exercised by `tests/harness/test_workflow_examples.py` in CI.

## L0–L4

- **L0**: a typo/local micro-task remains in the root context with self-verification and no durable ticket by default.
- **L1**: a bounded DELIVERY contract is a single READY ticket with fresh implementation and self-verification unless risk raises the floor.
- **L2**: a cross-subsystem feature promotes to planned work and independent QA.
- **L3**: an initiative delivers one rolling-frontier cohort while future uncertain cohorts remain fog.
- **L4**: trust-boundary work receives high-assurance controls even when implementation size is small.

The test suite parses the example artifacts with the real `Ticket` parser, computes their real frontier, and runs the real routing policy.

## Failure examples

`failures.json` executes four non-happy paths against production controller primitives:

- repeated identical failure -> `STOP_AND_REPLAN`;
- QA not satisfied -> DONE transition rejected / repair required;
- evidence recorded against another commit -> stale evidence rejected;
- READY ticket with `UNKNOWN_OWNER` -> dispatch rejected.

These examples are fixtures, not claims that every possible failure has been simulated.
