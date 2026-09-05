# yaaw-SE

> **Yet Another Agentic Workflow — Software Engineering.** Because apparently the world was one workflow short.

v2 keeps the deterministic control plane and replaces the old named-role surface with **five locked public skills** backed by a larger internal `_yaaw-core`.

```text
yaaw-prd
   ↓
yaaw-orchestrator
   ├─ READY → yaaw-implement → yaaw-review
   └─ no READY + unfinished intent → yaaw-planner → READY frontier
```

The five public skills are `yaaw-prd`, `yaaw-orchestrator`, `yaaw-planner`, `yaaw-implement`, and `yaaw-review`. Detailed workflow knowledge and specialist modules live in `_yaaw-core/`. There are no named role-profile files under `.agents/agents/` or `.codex/agents/`.

Underneath that small surface, the harness retains the deterministic ticket/state controller, machine-readable artifact and authority contracts, risk-aware L0-L4 routing, token-budgeted live context retrieval, ticket-bound runtime admission, correlated traces, bounded mutations, fresh QA, recovery/idempotency rules, domain-pack integration, and repository-native memory. Model executions make engineering judgments; software enforces the invariants it can actually know.

Material work becomes `DISCOVERY`, `DECISION`, and `DELIVERY` tickets. Unknown future territory stays fog until evidence makes it precise enough to plan. PRDs remain manual and human-authority: they define what the product should become; engineering planning is not allowed to silently rewrite that intent.

When freshness or independent review is required, a host may create a **generic bounded execution context** loaded with one skill plus a `yaaw.handoff/v1` contract and token-budgeted repository context. That is runtime transport, not a registered agent/persona, and it never becomes a second source of workflow truth.

## What is real vs. aspirational

Current maturity: **Beta / self-hosting control plane**.

Machine-enforced invariants include structured state/graph validation, ownership/authority checks, ticket-derived mutation scope, leases, source/evidence freshness, bounded retries/replans, idempotent mutations, runtime capability floors, role/level context budgets, priority-aware context packing, aggregate model-token backpressure, an executable gateway for adapters that physically route mutation through it, correlated traces, deterministic adversarial tests, and resource-aware repeated model-loop/workload comparison machinery.

The distinction matters: default CI uses deterministic fake runtimes and synthetic workloads. Those runs validate the harness and evaluator but remain `UNPROVEN` for model capability. An external result only becomes empirical when repository/ref/commit, runtime/provider/model, and the exact evaluation-manifest fingerprint are all pinned and observed. Efficiency improvement additionally requires quality non-regression. **This repository currently contains no committed external empirical workload result.**

Engineering correctness, architecture quality and subtle risk discovery still require model judgment. Host-level shell/tool bypass prevention, authenticated authority binding, OS/filesystem sandboxing, network isolation, exact provider tokenization/billing, provider state and production authority remain runtime/project-dependent.

So: useful for supervised real repositories and controlled automation; **not blanket production autonomy** and not a substitute for a project's own tests, security, observability, deployment or human approval controls.

See [`docs/workflow/maturity.md`](docs/workflow/maturity.md) for the exact boundary.

## See the whole thing

- **[v2 five-skill loop →](docs/workflow/v2-skill-loop.md)**
- **[End-to-end workflow →](docs/workflow/overview.md)**
- **[Context/token efficiency →](docs/workflow/context-efficiency.md)**
- **[Executable runtime gateway →](docs/workflow/runtime-gateway.md)**
- **[Model-loop evaluation →](docs/workflow/agent-evals.md)**
- **[Empirical evidence boundary →](docs/workflow/empirical-evidence.md)**
- **[Executable L0–L4/failure examples →](docs/workflow/examples.md)**
- **[Deterministic controller →](docs/workflow/controller.md)**
- **[Security/trust model →](docs/workflow/security.md)**
- **[Recovery/resumption →](docs/workflow/recovery.md)**

For the hot host bootstrap, start with [`AGENTS.md`](AGENTS.md). The filename is a host convention; its content is not a named-agent definition. Use [`docs/index.md`](docs/index.md) when you need to locate deeper documentation.

## Bring your repository

The core is generic. A consuming project supplies a domain pack for repository ownership, stack/build/test commands, risk boundaries, deployment/promotion policy and runtime/model capabilities. Those project facts extend the harness without becoming a second copy of the generic workflow.
