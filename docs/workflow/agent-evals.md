# Agent-loop evaluations

The deterministic conformance suite in `evals/scenarios.json` tests harness invariants. Agent-loop evaluations are a separate layer: they exercise repeated runtime trials and grade both the task outcome and the workflow trace.

## Evaluation contract

`evals/*.json` manifests using `yaaw.agent-eval/v1` pin:

- a stable manifest/workload identity and task;
- number of independent attempts;
- requested `k` values;
- an outcome grader;
- a trace grader;
- reliability/safety thresholds.

Outcome grading and trace grading are deliberately independent. A task can produce the right output while violating workflow policy, or obey policy while failing the task. A trial passes only when both graders pass.

## Reliability metrics

For `n` trials and `c` passing trials:

- `pass@k = 1 - C(n-c,k) / C(n,k)` estimates the probability that at least one of `k` sampled trials passes;
- `pass^k = C(c,k) / C(n,k)` measures the probability that all `k` sampled trials pass.

Reports also retain pass rate, outcome/trace pass rates, policy-violation count, replans, tokens, cost, latency and trial-level evidence.

## Adapter boundary

`scripts/yaaw/agent_eval.py` defines a provider-neutral runtime invocation protocol.

- `FakeRuntimeAdapter` is deterministic CI plumbing. Reports from it are always `SIMULATED`.
- `CommandRuntimeAdapter` is opt-in and invokes an explicitly supplied runtime command. It requires non-empty runtime, provider and model identity and marks those actually executed trials `OBSERVED`.

The command adapter receives a JSON request on stdin and must emit a final JSON result line containing task exit status, output, trace and optional resource data. Default CI never invokes the command adapter and therefore never needs provider credentials or network access.

`OBSERVED` means an identified external runtime was actually invoked by the evaluator. It does **not** by itself mean the workload is representative, production-safe, independently certified, or sufficient for a stronger maturity claim.

## CI fixture

`evals/agent-loop-fixture.json` intentionally contains a deterministic success/failure sequence. The Agent Harness executes it end to end through `scripts/run_agent_evals.py --adapter fake`. This proves the evaluator, graders, stochastic math and thresholds work together; it is not evidence of model capability.

Real model/provider trials should be stored as explicit observed evidence with immutable runtime/model/workload/commit fingerprints under the external workload/evidence protocol. Never convert a simulated CI report into empirical proof.
