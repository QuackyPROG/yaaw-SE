# Dispatch one handoff

## Purpose
Execute exactly one already-selected canonical workflow. This file is not the orchestration loop.

## Inputs
`.yaaw/runtime/handoff.json` created by `orchestration.determine-next-action`.

## Procedure
1. Validate handoff schema, workflow registry entry, role, source artifact revisions, transition-sequence basis, and repository identity.
2. If any basis is stale, discard the handoff and return `STALE_HANDOFF` to `orchestration.route`; do not execute it.
3. Load target role contract, target workflow contract, exact references, selected expertise, and minimal relevant repository context.
4. Execute the target workflow once.
5. Require its expected durable output/state/evidence or an explicit stop result.
6. Mark/remove the consumed runtime handoff and return control to `orchestration.route`.

Never recursively dispatch `orchestration.dispatch` as its own target.
