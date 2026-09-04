# Context and token efficiency

yaaw-SE treats context as a finite execution resource, not an invitation to copy repository state into every agent thread.

## Goals

The context subsystem has four invariants:

1. **Contract first** — goal, acceptance, source fingerprints, write scope, expected change surface, preservation invariants, verification and stop triggers are non-evictable.
2. **Retrieve before dumping** — repository context is gathered through bounded hooks instead of whole-tree scans.
3. **Pack to a token budget** — optional evidence competes for a role/level budget and is truncated or replaced by compact references when necessary.
4. **Fail before overflow** — if the mandatory contract itself does not fit the configured input allowance, the work must be re-sliced rather than silently exceeding the budget.

## Budget policy

`config/context-budget.json` is the hot policy. It declares, per role:

- maximum model context/window allowance;
- reserved output tokens;
- maximum retrieval tokens;
- maximum tokens for one retrieved evidence item.

L0-L4 multipliers make micro/bounded tasks cheaper while allowing more room for high-assurance work. `scripts/yaaw/token_budget.py` exposes a provider-neutral counter protocol. The default deterministic counter is a conservative UTF-8 heuristic; a runtime may substitute an exact provider/model tokenizer without changing routing, authority, scope or other workflow semantics.

The effective input budget is:

```text
max_window_tokens - reserved_output_tokens
```

The controller also exposes aggregate `max_total_llm_tokens` and `max_total_llm_calls` backpressure. A runtime should reserve the packed input estimate plus configured output allowance before invoking a model. This prevents a sequence of individually valid calls from becoming an unbounded initiative-level spend.

## Retrieval pipeline

`yaaw context <ticket> --role <role>` uses the current DELIVERY/DISCOVERY contract to identify at most a small set of declared targets, then executes read-only retrieval in this order:

```text
ownership
  -> repository map
  -> symbol search
  -> test seams
  -> targeted Git history
```

The local retrieval runtime uses deterministic ownership/repository-map queries and argv-based Git commands. It does not interpolate ticket text into a shell. Each result is bounded before packing.

Repository maps remain optional. When a domain pack registers `.yaaw/repository-map.json`, subsystem interfaces/tests/docs improve retrieval precision. When no map exists, yaaw-SE does not invent a subsystem; symbol/test retrieval falls back to bounded tracked-repository evidence.

## Priority-aware packing

The handoff is a `yaaw.handoff/v1` capsule. Mandatory contract fields are packed first. Retrieval items are ranked by requiredness and hook priority, with ownership and subsystem evidence ahead of broad history.

If an evidence item exceeds its per-item allocation it is truncated. If the retrieval or total input budget is exhausted, the item is omitted and a compact `source_ref` is retained in `omitted_retrieval`. This keeps the child aware that evidence exists and can be re-queried without paying to preload it.

The capsule records diagnostic budget metadata including the configured input/retrieval limits, estimated input tokens, retrieval tokens and omitted evidence count. Those diagnostics are evidence only; they do not grant authority.

## Context lifecycle

Fresh specialist contexts remain the default. Repository artifacts carry continuity. A context may be reused only while its role, initiative identity, owner/subsystem, acceptance, architecture/trust assumptions and source fingerprints remain compatible.

A child should never receive a transcript dump merely because a parent has it. Checkpoint durable facts to their canonical artifact and hand off stable IDs/fingerprints instead.

## Measuring efficiency

Agent-loop manifests may set hard thresholds for:

- total tokens;
- total cost;
- total duration;
- replans;
- quality/trace pass rate and policy violations.

Reports also calculate resource-per-attempt and resource-per-passing-trial metrics. External workload comparison reports governed-minus-baseline deltas plus token/cost/duration reduction ratios.

An efficiency improvement is valid only when quality does not regress. Fewer tokens with a worse pass rate is not a yaaw-SE success.

## External proof

Use `scripts/create_external_workload.py` to create a pinned `yaaw.workload/v1` manifest from exact baseline and governed eval manifests. It records immutable repository/ref/commit provenance plus the exact manifest IDs and SHA-256 fingerprints. Then execute each lane through an identified external runtime and compare the observed reports with `scripts/run_workload_compare.py`.

Synthetic CI fixtures validate this machinery but remain `UNPROVEN`. The harness never upgrades synthetic savings to an empirical model-quality claim.
