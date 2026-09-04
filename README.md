# yaaw-SE

> **Yet Another Agentic Workflow — Software Engineering.** Because apparently the world was one workflow short.

It still looks like a pile of Markdown, JSON, and a suspicious amount of policy for something called *yet another workflow*.

Underneath that, the current harness has a deterministic ticket/state controller, machine-readable artifact and authority contracts, risk-aware routing, bounded mutations, fresh QA, recovery/idempotency rules, adversarial evals, domain-pack integration, and repository-native memory. The agents keep the engineering judgment; software enforces the workflow invariants it can actually know.

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

Machine-enforced invariants include structured state/graph validation, ownership/authority checks, scope and lease controls, source/evidence freshness, bounded retries/replans, idempotent mutations, runtime capability floors, and CI/adversarial conformance tests. Engineering correctness, architecture quality and subtle risk discovery still require agent judgment. Filesystem/network isolation, model availability, provider state and production authority remain runtime/project-dependent.

So: useful for supervised real repositories and controlled automation; **not blanket production autonomy** and not a substitute for a project's own tests, security, observability, deployment or human approval controls.

See [`docs/workflow/maturity.md`](docs/workflow/maturity.md) for the exact boundary.

## See the whole thing

- **[End-to-end workflow →](docs/workflow/overview.md)**
- **[Executable L0–L4/failure examples →](docs/workflow/examples.md)**
- **[Deterministic controller →](docs/workflow/controller.md)**
- **[Security/trust model →](docs/workflow/security.md)**
- **[Recovery/resumption →](docs/workflow/recovery.md)**

For the control-plane contract, start with [`AGENTS.md`](AGENTS.md). For the documentation map, see [`docs/index.md`](docs/index.md).

## Bring your repository

The core is generic. A consuming project supplies a domain pack for repository ownership, stack/build/test commands, risk boundaries, deployment/promotion policy and runtime/model capabilities. Those project facts extend the harness without becoming a second copy of the generic workflow.
