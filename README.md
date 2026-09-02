# yaaw-SE

> **Yet Another Agentic Workflow — Software Engineering.** Because apparently the world was one workflow short.

It looks like a small pile of Markdown and JSON. That is mostly correct.

Then an agent uses it and gets routing, bounded work, progressive tickets, explicit replanning, repository memory, fresh QA, artifact ownership, optional human-authority PRDs, risk-weighted verification, and coherent delivery instead of one heroic prompt pretending the whole project is understood.

It also tries very hard **not** to form a committee for a typo.

## The idea

```text
small task  -> use the cheap route -> verify -> ship
large task  -> map what is known -> work the frontier -> discover -> replan -> verify -> ship
bad surprise -> STOP_AND_REPLAN, not "while I'm here..."
```

Material work becomes `DISCOVERY`, `DECISION`, and `DELIVERY` tickets. Unknown future territory stays fog until it is precise enough to plan. Agents get bounded authority; durable truth stays in the repository rather than disappearing with chat context.

PRDs are optional and manual: they define **what the product should become**. The Planner figures out the engineering route without silently rewriting that intent.

## See the whole thing

**[Open the end-to-end workflow diagram →](docs/workflow/overview.md)**

For the actual control-plane contract, start with [`AGENTS.md`](AGENTS.md). For the documentation map, see [`docs/index.md`](docs/index.md).

## Status

Generic harness. Bring your own repository/domain pack for stack-specific ownership, commands, verification, deployment rules, and runtime/model preferences.
