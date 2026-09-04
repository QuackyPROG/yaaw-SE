# Deterministic Controller CLI

`python scripts/yaaw_cli.py` exposes machine-enforced yaaw-SE inspection and explicit mutation surfaces without requiring an agent to reinterpret Markdown.

## Read-only inspection

```text
yaaw validate
yaaw status
yaaw frontier
yaaw blocked
yaaw ticket DEL-042
yaaw owner src/auth/session.py
yaaw artifact QA_REPORT
```

`validate` checks graph structure and structured ticket requirements. `frontier` computes the ready frontier from actual durable state and reports why unfinished work has no ready item.

## Explain decisions and build bounded context

```text
yaaw explain-route --default-level 1 --subsystems 2 --interface-change
yaaw context DEL-042 --role implementer
```

Route explanation is derived from deterministic complexity/criticality signals.

`context` is the normal child-handoff surface. It:

1. loads the role/level budget from `config/context-budget.json`;
2. derives bounded retrieval targets from the ticket's expected surface, allowed writes and source fingerprints;
3. executes read-only ownership -> repository-map -> symbol -> test -> targeted-history retrieval;
4. preserves mandatory contract fields;
5. packs optional evidence by priority within retrieval and total input token budgets;
6. emits compact references for omitted evidence instead of overflowing the context window.

Useful diagnostics:

```text
# Narrow the input allowance further for a constrained runtime.
yaaw context DEL-042 --role implementer --max-input-tokens 6000

# Inspect only the durable contract without live retrieval.
# This is a diagnostic escape hatch, not the normal dispatch path.
yaaw context DEL-042 --role implementer --no-retrieval

# Optional legacy hard character guard in addition to token budgeting.
yaaw context DEL-042 --role implementer --max-chars 12000
```

If mandatory contract fields cannot fit the configured input allowance, context construction fails and the work must be re-sliced. It does not drop acceptance, scope, invariants or verification merely to make a model call fit.

## Transition admission

```text
yaaw transition DEL-042 --to READY \
  --owner-resolved --blockers-done --acceptance-bounded --sources-current
```

This is deliberately a dry-run unless an explicit write operation is requested. It validates the legal transition and gates without hiding state changes inside inspection.

## Policy lint

```text
yaaw policy-lint
```

The lint fails on deterministic hazards including ambiguous ownership, graph corruption, `READY` work with unknown ownership, duplicate artifact identifiers, malformed structured tickets, and dangerously broad DELIVERY write scopes such as `**`.

The CLI is an operator/debugging surface for deterministic controls. It does not replace planning judgment, QA judgment, human product/release authority, or runtime/provider containment.
