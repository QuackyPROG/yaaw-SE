# yaaw-SE

**Yet Another Agentic Workflow — Software Engineering** is a repository-native engineering harness for work ranging from tiny local edits to long-running architectural initiatives.

The system is designed around five constraints:

1. use the cheapest safe execution path;
2. keep implementation work bounded and independently verifiable;
3. represent material work as a progressive dependency graph rather than a frozen giant plan;
4. allow new evidence to change future work through explicit plan deltas instead of silent scope expansion; and
5. keep durable truth in the repository, not in agent conversation history.

Start with [`AGENTS.md`](AGENTS.md) and [`docs/index.md`](docs/index.md).

## Core flow

```text
request
  -> orchestrator
  -> classify shape + complexity + ownership
  -> bounded discovery/planning only when required
  -> decision/discovery/delivery tickets
  -> ready frontier
  -> fresh implementer
  -> scope gate + targeted verification
  -> independent QA when risk requires it
  -> integration / CI / promotion

Material implementation discovery
  -> STOP_AND_REPLAN
  -> planner evaluates PLAN_DELTA
  -> future graph changes without erasing valid completed work
```

## Status

The repository contains the generic harness itself. Product-specific repositories are expected to add a **domain pack**: project structure, subsystem ownership, language/framework verification, specialist roles, deployment rules, and model/runtime preferences.
