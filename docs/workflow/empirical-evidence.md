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
- repository/ref/immutable commit;
- allowed write scope;
- verification seams;
- baseline and yaaw-SE-governed agent-eval manifest paths;
- expected manifest IDs and SHA-256 fingerprints for both lanes.

External workloads require a pinned hexadecimal commit id. A moving branch name alone is not empirical provenance. A runtime report with the right workload name but a different evaluation-manifest fingerprint remains `UNPROVEN`.

The helper below removes manual fingerprint bookkeeping without weakening provenance:

```text
python scripts/create_external_workload.py \
  --id EXT-001 \
  --repository owner/repo \
  --ref main \
  --commit <immutable-commit-sha> \
  --task "bounded observable task" \
  --allowed-scope src/auth/** \
  --verification "pytest tests/auth" \
  --baseline-manifest evals/external/base.json \
  --governed-manifest evals/external/governed.json \
  --output evals/workloads/ext-001.json
```

The builder loads and validates both eval manifests, records their exact IDs and computes the required SHA-256 fingerprints. It does not execute a model and cannot manufacture an empirical result.

## Runtime invocation

`config/runtime-adapters.json` registers both the project-local Codex adapter and a provider-neutral `generic-command` adapter contract. The generic adapter uses JSON over stdin/stdout and requires explicit runtime/provider/model identity. It is an invocation boundary, not permission to bypass yaaw-SE: the external wrapper is required to enforce the runtime gateway and return correlated gateway/action trace evidence.

Default CI never invokes an external runtime. It validates the generic adapter contract and uses deterministic fixtures.

## Comparison and efficiency

`scripts/run_workload_compare.py` consumes baseline and governed agent-eval reports and preserves both lanes in `yaaw.workload-comparison/v1`. Raw deltas are governed minus baseline for pass rate, trace pass rate, policy violations, replans, token use, cost and duration.

The comparison additionally calculates:

- quality non-regression;
- token reduction ratio;
- cost reduction ratio;
- duration reduction ratio;
- whether token efficiency is non-regressing or improved.

An efficiency claim is valid only when the governed lane does not regress pass rate/trace pass rate or increase policy violations. Cutting token use while lowering quality is explicitly **not** an efficiency success.

A positive synthetic delta remains `UNPROVEN`. A comparison is `EMPIRICAL` only when both lanes independently qualify as empirical evidence for the same pinned external workload. CI additionally asserts that the synthetic fixture's report fingerprints match their manifests and that the comparison remains `UNPROVEN`.

## Commands

Synthetic CI conformance:

```text
python scripts/run_workload_compare.py --workload evals/workloads/synthetic-local.json --simulate
```

Observed external lane:

```text
python scripts/run_agent_evals.py \
  --manifest evals/external/base.json \
  --adapter command \
  --runtime-id <runtime> \
  --provider <provider> \
  --model <model> \
  --report .yaaw/runtime/base-report.json \
  -- <external-runtime-command>
```

Run the governed manifest the same way, then compare:

```text
python scripts/run_workload_compare.py \
  --workload evals/workloads/ext-001.json \
  --baseline-status OBSERVED \
  --governed-status OBSERVED \
  --baseline-report .yaaw/runtime/base-report.json \
  --governed-report .yaaw/runtime/governed-report.json
```

Credential/network access is never implicit. If an external runtime or repository is unavailable, record `BLOCKED` or `NOT_RUN` rather than pretending proof exists.
