# `.yaaw-core`

`.yaaw-core` is the canonical private implementation behind YAAW public skills.

## Composition
```text
skills/ -> registry -> Orchestrator intent/routing
        -> exact handoff + role context policy
        -> role + workflow + selected expertise
        -> optional focused project-memory retrieval
        -> durable artifacts + current repository reality
        -> evidence-backed state transition
        -> orchestration re-inspection
```

## Authority
- Human/PRD: product intent and scope.
- Planner: engineering decisions, specs, readiness, and ticket contracts.
- Implementer: bounded code/test changes and verification evidence within an admitted ticket.
- Reviewer: independent acceptance and defect classification.
- Orchestrator: continuity, reconciliation, invalidation coordination, ticket lifecycle, and routing.

Project memory is not a sixth authority role. It is optional derived context governed by `core/project-memory.md` and `registries/context-policy.json`.

## Project artifact roots

`docs/` stores durable project knowledge:

```text
docs/product/product.md
docs/engineering/engineering.md
docs/engineering/decisions/
docs/specs/
docs/rules/
```

`.yaaw/` stores autonomous execution state:

```text
.yaaw/tickets/
.yaaw/reviews/
.yaaw/evidence/
.yaaw/runtime/
.yaaw/state.json
```

The ownership contract is `core/folder-ownership.md`.

## Canonical lifecycle
`PRD -> planning -> readiness -> spec -> tickets -> implement -> review -> repair/replan/pass -> next frontier -> COMPLETE`.

Read these contracts together:
- `core/lifecycle.md`
- `core/authority.md`
- `core/folder-ownership.md`
- `core/artifact-model.md`
- `core/routing.md`
- `core/transitions.md`
- `core/invalidation.md`
- `core/recovery.md`
- `core/context-loading.md`
- `core/project-memory.md`

Any workflow context may disappear after durable output without destroying project understanding. Optional memory makes the next disposable role faster, but the artifact graph remains sufficient when memory is absent.
