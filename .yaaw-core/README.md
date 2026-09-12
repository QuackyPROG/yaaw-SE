# `.yaaw-core`

`.yaaw-core` is the canonical private implementation behind YAAW public skills.

## Composition
```text
skills/ -> registry -> role + workflow + applicable shared rules + selected expertise
        -> durable artifacts + repository reality
        -> evidence-backed state transition
        -> orchestration re-inspection
```

Roles own semantic authority. Workflows own process. Shared rules provide reusable cross-cutting behavior without creating another authority or lifecycle layer. Expertise provides specialist knowledge only.

`rules/assumption-challenge.md` is one such behavioral rule: PRD consumes it for product-semantics scrutiny and Planner consumes it for repository-backed engineering scrutiny. It is not a public skill, workflow phase, state, or durable artifact.

## Authority
- Human/PRD: product intent and scope.
- Planner: engineering decisions, specs, readiness, tickets.
- Implementer: bounded code changes within an admitted ticket.
- Reviewer: independent acceptance and defect classification.
- Orchestrator: continuity, reconciliation, invalidation coordination, and routing.

## Durable project root
`.yaaw/` stores product/engineering/spec/ticket/review/evidence/rules plus `state.json`. `.yaaw/runtime/` stores replaceable observed-state and handoff caches used only for coordination.

## Canonical lifecycle
`PRD -> planning -> readiness -> spec -> tickets -> implement -> review -> repair/replan/pass -> next frontier -> COMPLETE`.

Read these contracts together:
- `core/lifecycle.md`
- `core/authority.md`
- `core/routing.md`
- `core/transitions.md`
- `core/invalidation.md`
- `core/recovery.md`
- `core/context-loading.md`
- `rules/assumption-challenge.md` when PRD/Planner must decide what deserves questioning
- `rules/question-format.md` when PRD/Planner presents a question round

Any workflow context may disappear after durable output without destroying project understanding.
