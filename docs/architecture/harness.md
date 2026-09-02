# Harness Architecture

## Objective

The harness should remain efficient for a one-line fix and still remain coherent when work lasts many sessions or crosses subsystems. It does this by separating **control**, **durable knowledge**, **execution**, and **runtime policy**.

## Layers

### 1. Control plane

`AGENTS.md`, `.agents/router.json`, `.agents/ownership.json`, role contracts, rules, and skills decide how work is classified, bounded, promoted, delegated, and verified.

### 2. Durable project memory

Code/tests, ADRs, specs, initiative maps, tickets, and canonical documentation hold facts that must outlive a thread.

### 3. Execution plane

Fresh or selectively persistent agent threads perform discovery, planning, implementation, QA, and release work. Threads are replaceable execution contexts.

### 4. Runtime/model plane

`.codex/` and `config/model-profiles.example.json` demonstrate how roles can be mapped to a runtime/model policy without making model choices part of engineering semantics.

## Scale-adaptive control

The Orchestrator selects L0–L4 from evidence, not from request length. The same feature can start L1 and promote to L2/L3 after an unexpected boundary is discovered.

```text
raw request
  -> classify work shape
  -> identify likely owner
  -> estimate uncertainty + blast radius + reversibility
  -> select minimum safe level
  -> execute route
  -> promote if evidence invalidates route assumptions
```

## Rolling-wave planning

Large initiatives are represented at multiple resolutions:

```text
destination
  -> known decisions/discoveries
  -> current ready frontier
  -> near-term delivery tickets
  -> fog / not-yet-specified work
```

The system intentionally avoids fabricating detailed tickets for fog. Resolution of one frontier item may expose, delete, split, or reframe future work.

## Vertical delivery

Delivery tickets should be tracer bullets: narrow complete behavior that can be verified independently. Horizontal migration/refactor work is allowed when vertical slicing cannot keep the repository green; use expand–migrate–contract or an explicitly isolated integration sequence.

## Controlled adaptation

The worker that discovers a problem does not own replanning authority. The Implementer returns evidence; the Planner changes unresolved graph state through a `PLAN_DELTA`; the Orchestrator then routes the new frontier.

This separation prevents two failure modes: frozen plans that cannot respond to reality, and unconstrained workers that redesign the project while implementing a ticket.
