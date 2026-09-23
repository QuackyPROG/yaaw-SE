# YAAW Codex Runtime Adapter

This file defines **Codex execution mechanics only**. Canonical YAAW role/workflow semantics live under `.yaaw-core/system/`.

Configured YAAW runtime mode: **{{RUNTIME_MODE}}**.

## Root ownership
During autonomous `@yaaw-orchestrator` operation, the active/root Codex session is the YAAW Orchestrator. Never spawn a child `yaaw_orchestrator`.

## Authority worker mapping
When `orchestration.dispatch` selects a non-Orchestrator role, map it only after YAAW has already selected the handoff:

- `prd` -> `yaaw_prd`
- `planner` -> `yaaw_planner`
- `implementer` -> `yaaw_implementer`
- `reviewer` -> `yaaw_reviewer`

Codex role selection is an execution mechanism, never a second router.

## Runtime modes

### auto
1. Prefer a fresh named YAAW worker when the active spawn schema exposes named role / agent-type selection.
2. If named selection is unavailable or is explicitly rejected **before a child starts**, spawn one fresh generic worker for the same handoff.
3. If no isolated worker capability is available, execute the selected role/workflow inline.
4. If a child was created and then failed/interrupted, do not blindly retry. Return to YAAW reality inspection first.

### isolated-required
Use the named -> generic isolation ladder above. If no isolated worker can be created, return:

`BLOCKED:HOST_ISOLATION_UNAVAILABLE`

Do not fall back inline.

### inline
Do not spawn YAAW authority workers. Execute the selected handoff in the current context using canonical YAAW role/workflow contracts.

## Fresh worker bootstrap
Prefer no inherited parent conversation history. If the active host exposes a no-history control such as `fork_turns`, use its no-history value; if an older compatible host exposes a boolean fork-context control, disable inherited context.

Give a worker only:
- resolved workspace root;
- semantic role;
- `.yaaw-core/runtime/handoff.json`;
- instruction to read the handoff first;
- instruction to load the canonical role and resolve the workflow through registries;
- instruction to load only admitted artifacts, expertise, and repository context;
- instruction not to route/spawn another YAAW authority role;
- instruction to persist durable output before returning;
- instruction to return one legal typed result.

Do not paste product/engineering/spec/ticket/review history or the parent planning chat into the worker prompt when those facts already exist durably.

## Completion and recovery
One dispatch creates one fresh authority worker. Do not reuse a Planner across separate canonical planning dispatches. Never reuse an Implementer context as Reviewer.

After worker success, failure, interruption, no response, or lost response:
1. treat worker text as an execution signal only;
2. return to `orchestration.inspect-state`;
3. verify expected artifacts, revisions, repository state, evidence, and review state;
4. route again from observed reality.

Workers never perform YAAW lifecycle routing to peer authority roles.

## Capability note
YAAW does not force an experimental multi-agent backend. Use the capabilities the active Codex runtime actually exposes and follow the configured fallback mode.
