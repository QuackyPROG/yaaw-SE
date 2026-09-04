# Runtime gateway

The runtime gateway is the executable composition point for deterministic admission before a runtime performs a side-effecting action.

## Boundary

`scripts/yaaw/runtime_gateway.py` composes existing policy instead of becoming a second policy source:

1. controller preflight verifies READY state, blockers, ownership, acceptance and source freshness;
2. command effects are inferred and compared with the role security capability floor;
3. artifact/field mutation authority is checked when workflow artifacts are mutated;
4. declared paths are checked against allowed/forbidden scope and deterministic ownership;
5. product-code mutation requires the role capability explicitly;
6. real admission consumes dispatch budget and acquires the writer lease;
7. the provider/OS runner is invoked only after admission, and the lease is released afterward.

`inspect()` is a pure dry-run admission explanation and never consumes budget or acquires a lease. `admit()` performs the reserving controller admission. `run()` is the intended wrapper for adapters that can make the gateway the actual execution boundary.

## What this guarantees

When a runtime adapter exposes mutation only through `RuntimeGateway.run` (or an equivalent `admit`/`release` wrapper), under-declared command risk, stale sources, unknown owners, path-scope escape, field-authority violations, missing role capability and writer-lease collision fail closed before the injected runner is called.

## What this does not guarantee

A repository cannot prevent a host runtime from exposing a separate unrestricted shell/tool path. If the host can bypass the gateway, containment remains runtime-dependent and must not be described as hard enforcement. Production authority, OS sandboxing, filesystem isolation, credentials and network egress still belong to the consuming runtime/provider.

The correct maturity language is therefore **gateway-enforceable** where adapters wire mutation through this boundary, not blanket host-level containment.

## Adapter rule

A runtime adapter claiming `controller_admission` for mutation must state whether enforcement is:

- `GATEWAY_ENFORCED` — mutation is physically routed through the gateway or an equivalent native hook;
- `NATIVE_ENFORCED` — the provider offers an equivalent non-bypassable policy hook;
- `INSTRUCTION_ONLY` — prompt/config guidance requests admission but the host exposes a bypass path.

Only the first two satisfy hard runtime admission. `INSTRUCTION_ONLY` remains defense in depth.
