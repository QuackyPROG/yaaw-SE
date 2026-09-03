# Domain Packs

yaaw-SE deliberately separates generic engineering control from repository-specific facts. A consuming project should declare those facts in a versioned `.yaaw/domain-pack.json` instead of editing generic agents and registries directly.

## Contract

A v1 pack uses `schema: yaaw.domain-pack/v1` and declares compatibility with the harness. It may define:

- a machine-readable repository map;
- path ownership and co-ownership;
- path/risk boundaries and minimum assurance;
- named verification commands and the paths/risks they cover;
- optional specialist agents or skills;
- release environments and promotion authority;
- branch/release policy and model-profile preference.

See [`examples/domain-pack/.yaaw/domain-pack.json`](../examples/domain-pack/.yaaw/domain-pack.json).

## Layering

The intended precedence is:

```text
generic harness
  -> organization domain pack (optional)
  -> repository domain pack
```

List entries are keyed (`ownership.pattern`, `verification.id`, `risk_boundaries.pattern`, `specialists.id`, `environments.id`). A later pack may replace an existing keyed entry only with `override: true`. Equal-precedence conflicts fail closed rather than relying on array order.

## Ownership

Ownership resolution is deterministic:

1. matching rules are collected;
2. the most specific path pattern wins;
3. equal-specificity rules with different authority are an error;
4. an explicit deny boundary wins at the same specificity;
5. no match resolves to `UNKNOWN_OWNER`.

This makes ownership usable by software instead of being advisory prose.

## Risk and verification

Planning complexity and consequence are separate. A tiny auth change can remain small in implementation scope while still receiving an L4/high-assurance floor. A broad mechanical documentation migration can be planning-heavy without carrying the same consequence.

Domain packs therefore declare risk boundaries independently of work shape. Verification entries are named contracts selected from changed paths and risk tags; tickets should reference those IDs rather than inventing project commands repeatedly.

## Repository map and retrieval

A repository map gives agents a compact starting index of subsystem paths, public interfaces, related tests and canonical docs. It is not a substitute for code search or runtime evidence. Context retrieval should proceed from the current work artifact to ownership/map data, then symbol/interface neighborhood, tests and relevant history.

## Specialists

Specialists are extensions, not a reason to inflate the generic six-agent topology. Add a specialist only when a generic role plus a procedural skill cannot safely express the repository's domain behavior.

## Runtime state

`.yaaw/runtime/` is ephemeral controller state (leases, snapshots, events) and is ignored by Git. Durable engineering truth remains in PRDs/specs/ADRs/tickets/evidence. Never persist credentials or secret values into either durable artifacts or runtime logs.
