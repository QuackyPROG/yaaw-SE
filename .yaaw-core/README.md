# `.yaaw-core`

`.yaaw-core` is the canonical implementation behind YAAW's public skills.

## Architecture

```text
skills/ -> registries -> role + workflow + selected expertise -> durable artifacts -> repository reality
```

The system is intentionally context-disposable. Any workflow context may terminate after it writes its accepted decisions, evidence, or state transition to durable artifacts.

## Authority

- Human/PRD: product intent and scope.
- Planner: engineering decisions, specs, and ticket contracts.
- Implementer: bounded code changes within an admitted ticket.
- Reviewer: independent acceptance outcome and defect classification.
- Orchestrator: continuity, reconciliation, and next-action routing.

## Project artifact root

The canonical project memory root is `.yaaw/`.

## Main lifecycle

`PRD -> planning -> readiness -> spec -> tickets -> implement -> review -> repair/replan/pass -> next frontier`.

The orchestrator may enter at any point by reconstructing observed reality first.
