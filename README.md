# yaaw-SE

> **Yet Another Agentic Workflow — Software Engineering.** Because apparently the world was one workflow short.

It still looks like a pile of Markdown, JSON, and a suspicious amount of policy for something called *yet another workflow*.

Underneath that, the harness has a deterministic ticket/state controller, machine-readable artifact and authority contracts, risk-aware routing, ticket-bound runtime admission, correlated traces, repeated agent-loop evals, workload provenance/comparison, bounded mutations, fresh QA, recovery/idempotency rules, domain-pack integration, and repository-native memory. Agents keep the engineering judgment; software enforces the workflow invariants it can actually know.

It also still tries very hard **not** to form a committee for a typo.

## The idea

```text
small task   -> cheapest safe route -> verify -> finish
large task   -> map known territory -> work frontier -> discover -> replan -> verify
bad surprise -> STOP_AND_REPLAN, not "while I'm here..."
```

Material work becomes `DISCOVERY`, `DECISION`, and `DELIVERY` tickets. Unknown future territory stays fog until evidence makes it precise enough to plan. PRDs remain optional/manual and human-authority: they define what the product should become; engineering planning is not allowed to silently rewrite that intent.

## What is real vs. aspirational

Current maturity: **Beta / self-hosting control plane**.

Machine-enforced invariants include structured state/graph validation, ownership/authority checks, ticket-derived mutation scope, leases, source/evidence freshness, bounded retries/replans, idempotent mutations, runtime capability floors, an executable gateway for adapters that physically route mutation through it, correlated traces, deterministic adversarial tests, and repeated agent-eval/workload comparison machinery.

The distinction matters: default CI uses deterministic fake runtimes and synthetic workloads. Those runs validate the harness and evaluator but remain `UNPROVEN` for model capability. An external result only becomes empirical when repository/ref/commit, runtime/provider/model, and the exact evaluation-manifest fingerprint are all pinned and observed. **This repository currently contains no committed external empirical workload result.**

Engineering correctness, architecture quality and subtle risk discovery still require agent judgment. Host-level shell/tool bypass prevention, authenticated role binding, OS/filesystem sandboxing, network isolation, provider state and production authority remain runtime/project-dependent.

So: useful for supervised real repositories and controlled automation; **not blanket production autonomy** and not a substitute for a project's own tests, security, observability, deployment or human approval controls.

See [`docs/workflow/maturity.md`](docs/workflow/maturity.md) for the exact boundary.

## See the whole thing

- **[End-to-end workflow →](docs/workflow/overview.md)**
- **[Executable runtime gateway →](docs/workflow/runtime-gateway.md)**
- **[Agent-loop evaluation →](docs/workflow/agent-evals.md)**
- **[Empirical evidence boundary →](docs/workflow/empirical-evidence.md)**
- **[Executable L0–L4/failure examples →](docs/workflow/examples.md)**
- **[Deterministic controller →](docs/workflow/controller.md)**
- **[Security/trust model →](docs/workflow/security.md)**
- **[Recovery/resumption →](docs/workflow/recovery.md)**

For the control-plane contract, start with [`AGENTS.md`](AGENTS.md). For the documentation map, see [`docs/index.md`](docs/index.md).

## Bring your repository

The core is generic. A consuming project supplies a domain pack for repository ownership, stack/build/test commands, risk boundaries, deployment/promotion policy and runtime/model capabilities. Those project facts extend the harness without becoming a second copy of the generic workflow.
