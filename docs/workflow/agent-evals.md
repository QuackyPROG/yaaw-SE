# Agent-loop evaluations

The deterministic conformance suite in `evals/scenarios.json` tests harness invariants. Agent-loop evaluations are a separate layer: they exercise repeated runtime trials and grade both task outcome and workflow trace while accounting for resource use.

## Evaluation contract

`evals/*.json` manifests using `yaaw.agent-eval/v1` pin:

- a stable manifest/workload identity and task;
- number of independent attempts;
- requested `k` values;
- an outcome grader;
- a trace grader;
- reliability/safety thresholds;
- optional resource ceilings for replans, tokens, cost and duration.

Outcome grading and trace grading are deliberately independent. A task can produce the right output while violating workflow policy, or obey policy while failing the task. A trial passes only when both graders pass.

A report's overall `thresholds_met` additionally respects configured resource ceilings. A run can therefore be semantically green but fail its evaluation because it consumed more tokens/cost/time or replans than the manifest permits.

## Reliability and efficiency metrics

For `n` trials and `c` passing trials:

- `pass@k = 1 - C(n-c,k) / C(n,k)` estimates the probability that at least one of `k` sampled trials passes;
- `pass^k = C(c,k) / C(n,k)` measures the probability that all `k` sampled trials pass.

Reports retain pass rate, outcome/trace pass rates, policy-violation count, replans, total tokens, cost, latency and trial-level evidence. They also normalize resources into:

- tokens/cost/duration per attempt;
- tokens/cost/duration per passing trial when at least one trial passes.

This prevents a superficially high pass rate from hiding an arbitrarily expensive agent loop.

## Adapter boundary

`scripts/yaaw/agent_eval.py` defines a provider-neutral runtime invocation protocol.

- `FakeRuntimeAdapter` is deterministic CI plumbing. Reports from it are always `SIMULATED`.
- `CommandRuntimeAdapter` is opt-in and invokes an explicitly supplied runtime command. It requires non-empty runtime, provider and model identity and marks those actually executed trials `OBSERVED`.

The command adapter receives a JSON request on stdin and must emit a final JSON result line containing task exit status, output, trace and optional resource data. Default CI never invokes the command adapter and therefore never needs provider credentials or network access.

`scripts/run_agent_evals.py` fingerprints the exact parsed evaluation manifest into every emitted report. External workload evidence can therefore prove that the observed report used the exact grader/threshold configuration pinned by the workload rather than merely sharing the same manifest name.

`OBSERVED` means an identified external runtime was actually invoked by the evaluator. It does **not** by itself mean the workload is representative, production-safe, independently certified, or sufficient for a stronger maturity claim.

## CI fixture

`evals/agent-loop-fixture.json` intentionally contains a deterministic success/failure sequence. The Agent Harness executes it end to end through `scripts/run_agent_evals.py --adapter fake`. This proves the evaluator, graders, stochastic math, manifest fingerprinting and thresholds work together; it is not evidence of model capability.

Real model/provider trials should be stored as explicit observed evidence with immutable runtime/model/workload/commit and evaluation-manifest fingerprints under the external workload/evidence protocol. Efficiency claims must compare against a pinned baseline and preserve quality; never convert simulated CI output or a cheaper but worse run into empirical proof.
