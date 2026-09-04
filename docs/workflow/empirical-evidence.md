# Empirical evidence and portability

yaaw-SE separates evaluator conformance from evidence about actual model/runtime behavior.

## Evidence ladder

1. **SIMULATED / UNPROVEN** — deterministic fake adapters and synthetic workloads prove runner, grader, trace and comparison machinery only.
2. **OBSERVED / UNPROVEN** — a runtime may have executed, but the workload is synthetic or repository/runtime/evaluation provenance is insufficient for an external empirical claim.
3. **OBSERVED / EMPIRICAL** — an external workload is pinned to repository, ref and immutable commit; the runtime report identifies an external runtime/provider/model; and the report's manifest ID plus SHA-256 fingerprint match the exact baseline/governed evaluation configuration pinned by the workload.

`NOT_RUN`, `BLOCKED`, `FAILED`, and `OBSERVED` are separate observation states. Missing credentials, unavailable providers, runtime crashes, grader failures and ordinary failed trials must never be collapsed into a successful or absent data point.

## Workload manifests

`yaaw.workload/v1` records:

- workload identity and task;
- `SYNTHETIC` or `EXTERNAL` provenance;
- repository/ref/commit fingerprint source;
- allowed write scope;
- verification seams;
- baseline and yaaw-SE-governed agent-eval manifest paths;
- expected manifest IDs and SHA-256 fingerprints for both lanes.

External workloads require a pinned hexadecimal commit id. A moving branch name alone is not empirical provenance. A runtime report with the right workload name but a different evaluation-manifest fingerprint remains `UNPROVEN`.

## Runtime invocation

`config/runtime-adapters.json` registers both the project-local Codex adapter and a provider-neutral `generic-command` adapter contract. The generic adapter uses JSON over stdin/stdout and requires explicit runtime/provider/model identity. It is an invocation boundary, not permission to bypass yaaw-SE: the external wrapper is required to enforce the runtime gateway and return correlated gateway/action trace evidence.

Default CI never invokes an external runtime. It validates the generic adapter contract and uses deterministic fixtures.

## Comparison

`scripts/run_workload_compare.py` consumes baseline and governed agent-eval reports and preserves both lanes in `yaaw.workload-comparison/v1`. Deltas are governed minus baseline for pass rate, trace pass rate, policy violations, replans, token use, cost and duration.

A positive synthetic delta remains `UNPROVEN`. A comparison is `EMPIRICAL` only when both lanes independently qualify as empirical evidence for the same pinned external workload. CI additionally asserts that the synthetic fixture's report fingerprints match their manifests and that the comparison remains `UNPROVEN`.

## Commands

Synthetic CI conformance:

```text
python scripts/run_workload_compare.py --workload evals/workloads/synthetic-local.json --simulate
```

External reports are produced separately through the opt-in command adapter in `scripts/run_agent_evals.py`, which records the exact manifest fingerprint in the report. Those reports can then be supplied to the comparison runner with `--baseline-report`, `--governed-report`, and `OBSERVED` statuses. Credential/network access is never implicit.
