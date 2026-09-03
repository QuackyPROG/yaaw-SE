# Deterministic Controller CLI

`python scripts/yaaw_cli.py` exposes the machine-enforced parts of yaaw-SE without requiring an agent to reinterpret Markdown.

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

`validate` checks both graph structure and structured ticket document requirements. `frontier` computes the ready frontier from actual ticket state and reports why an unfinished graph has no ready work.

## Explain decisions

```text
yaaw explain-route --default-level 1 --subsystems 2 --interface-change
yaaw context DEL-042 --role implementer
```

Route explanation is derived from deterministic complexity/criticality signals. Context generation renders the bounded handoff contract from ticket metadata and refuses oversized capsules rather than silently copying excessive repository context.

## Transition admission

```text
yaaw transition DEL-042 --to READY \
  --owner-resolved --blockers-done --acceptance-bounded --sources-current
```

This is deliberately a dry-run. It validates the legal transition and its gates but does not rewrite the ticket. Mutation remains a separate controlled operation so an agent cannot hide state changes inside an inspection command.

## Policy lint

```text
yaaw policy-lint
```

The lint fails on deterministic hazards including ambiguous ownership, graph corruption, `READY` work with unknown ownership, duplicate artifact identifiers, malformed structured tickets, and dangerously broad DELIVERY write scopes such as `**`.

The CLI is an operator/debugging surface for the controller. It is not a replacement for planning judgment, QA judgment, or human product/release authority.
