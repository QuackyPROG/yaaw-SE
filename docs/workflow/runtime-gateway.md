# Runtime gateway

The runtime gateway is the executable composition point for deterministic admission before a runtime performs a side-effecting action.

## Boundary

`scripts/yaaw/runtime_gateway.py` composes existing policy instead of becoming a second policy source:

1. controller preflight verifies READY state, blockers, ownership, acceptance and source freshness;
2. the admitted ticket's durable `allowed_write` / `forbidden_write` metadata becomes the authoritative path-scope ceiling;
3. caller/request scope may narrow that ceiling but can never replace or widen it;
4. command effects are inferred and compared with the role security capability floor;
5. filesystem/dependency mutations, product mutations and artifact mutations must declare affected paths so deterministic scope/ownership checks cannot be skipped by omitting `paths`;
6. artifact/field mutation authority is checked when workflow artifacts are mutated;
7. declared paths are checked against ticket scope, optional narrower request scope and deterministic ownership;
8. product-code mutation requires the role capability explicitly;
9. real admission consumes dispatch budget and acquires the writer lease;
10. the provider/OS runner is invoked only after admission, and the lease is released afterward.

`inspect()` is a pure dry-run admission explanation and never consumes budget or acquires a lease. `admit()` performs the reserving controller admission. `run()` is the intended wrapper for adapters that can make the gateway the actual execution boundary.

## Scope authority

The runtime request is not allowed to grant itself filesystem scope. The ticket loaded by the controller is canonical contract memory. If the ticket has no durable `allowed_write` scope, a path-bearing mutation fails closed. Supplying `allowed_paths=("**",)` cannot widen a ticket that only admits `src/auth/**`; at most, request scope can add a second narrower check.

Mutation commands that affect the local filesystem or dependencies must enumerate affected paths. This closes the declaration bypass where a caller could previously submit a mutating command while leaving `paths` empty.

## What this guarantees

When a runtime adapter exposes mutation only through `RuntimeGateway.run` (or an equivalent `admit`/`release` wrapper), under-declared command risk, stale sources, unknown owners, ticket-scope escape, request-scope escape, missing affected-path declarations, field-authority violations, missing role capability and writer-lease collision fail closed before the injected runner is called.

## What this does not guarantee

A repository cannot prevent a host runtime from exposing a separate unrestricted shell/tool path. If the host can bypass the gateway, containment remains runtime-dependent and must not be described as hard enforcement. The gateway also relies on the runtime adapter to bind the authenticated executing role/action identity to the request it submits; repository code cannot authenticate a provider process on its own. Production authority, OS sandboxing, actual filesystem syscall containment, credentials and network egress still belong to the consuming runtime/provider.

The correct maturity language is therefore **gateway-enforceable** where adapters wire mutation through this boundary, not blanket host-level containment.

## Adapter rule

A runtime adapter claiming `controller_admission` for mutation must state whether enforcement is:

- `GATEWAY_ENFORCED` — mutation is physically routed through the gateway or an equivalent native hook;
- `NATIVE_ENFORCED` — the provider offers an equivalent non-bypassable policy hook;
- `INSTRUCTION_ONLY` — prompt/config guidance requests admission but the host exposes a bypass path.

Only the first two satisfy hard runtime admission. `INSTRUCTION_ONLY` remains defense in depth.
