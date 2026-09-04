# Domain Packs

yaaw-SE separates generic engineering control from repository-specific facts. A consuming project declares those facts in a versioned `.yaaw/domain-pack.json` instead of editing generic agents and registries directly.

## Contract

A v1 pack uses `schema: yaaw.domain-pack/v1`, a semantic `pack_version`, and an explicit harness compatibility range. It may define repository maps, ownership/co-ownership, risk floors, verification contracts, optional specialists, release environments, branch policy and model-profile preference.

See [`examples/domain-pack/.yaaw/domain-pack.json`](../examples/domain-pack/.yaaw/domain-pack.json).

## Install / update lifecycle

`yaaw domain-pack <source>` is a dry-run install/update plan. `--write` atomically creates or updates `.yaaw/domain-pack.json` and `.yaaw/domain-pack.lock.json`. The lock records the exact content digest, source, pack version and harness version used for admission.

- incompatible harness versions fail closed;
- identical digest is a `NOOP`;
- version/content changes are explicit `UPDATE`s;
- downgrade requires `--allow-downgrade`;
- replacing a differently named installed pack requires `--allow-replace`.

This prevents silent domain-policy drift during harness or pack upgrades.

## Layering

The intended precedence is generic harness -> organization pack (optional) -> repository pack. List entries are keyed (`ownership.pattern`, `verification.id`, `risk_boundaries.pattern`, `specialists.id`, `environments.id`). A later pack replaces an existing keyed entry only with `override: true`; equal-precedence conflicts fail closed.

## Ownership and repository evidence

Domain-pack ownership resolution remains deterministic. CODEOWNERS and repository rulesets may be observed as additional evidence and conflict signals, but they do not silently overwrite yaaw semantic ownership. Host policy can strengthen delivery requirements without granting product/release authority.

## Risk, verification and retrieval

Planning complexity and consequence are separate. Domain packs declare risk boundaries independently of work shape. Verification entries are named contracts selected from changed paths and risk tags. Repository maps give agents a compact starting index of subsystem paths, interfaces, tests and canonical docs; they are not substitutes for code search or runtime evidence.

## Specialists

Specialists are extensions, not a reason to inflate the generic six-agent topology. Add one only when a generic role plus a procedural skill cannot safely express the repository's domain behavior.

## Runtime state

`.yaaw/runtime/` is ephemeral controller state (leases, snapshots, events, idempotency journals) and is ignored by Git. Durable engineering truth remains in PRDs/specs/ADRs/tickets/evidence. Never persist credentials or secret values into either durable artifacts or runtime logs.
