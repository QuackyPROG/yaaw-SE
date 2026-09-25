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

## Configured authority execution profiles

{{AUTHORITY_EXECUTION_PROFILES}}

These values are generated from the same normalized settings stored in the YAAW installation manifest. `HOST_INHERIT` is symbolic: do not guess a concrete model or reasoning value.

## Execution-profile fidelity
Changing the execution mechanism is allowed. Changing the configured effective authority profile without explicit user configuration is not.

Before any non-inline authority dispatch:
1. Resolve the required authority profile shown above for the selected primary or fallback authority.
2. Prefer the exact named YAAW worker. Its managed agent file is the authoritative role-specific configuration layer.
3. If named selection is unavailable before a child starts, compare the generic worker baseline with the required profile dimension by dimension.
4. A mismatched model may be corrected only when the active spawn schema exposes an authoritative model override. A mismatched reasoning value may be corrected only when the active spawn schema exposes an authoritative reasoning/model_reasoning_effort override.
5. Spawn generic only when every mismatched dimension is either already equivalent or can be explicitly corrected to the required value.
6. If generic cannot preserve the profile, compare the inline/root baseline with the required profile and execute inline only when equivalent in `auto` mode.
7. Unknown is not assumed equivalent. `HOST_INHERIT` equals another `HOST_INHERIT` only because both paths use the same unresolved inheritance chain.
8. If the active mechanism cannot guarantee the profile, stop with `BLOCKED:HOST_EXECUTION_PROFILE_UNAVAILABLE`.

Never prompt a generic worker to *claim* a model/reasoning identity. Worker self-report is not proof of the host execution profile.

## Capability escalation fallback

{{FAILURE_FALLBACK_POLICY}}

Failure accounting is read from `.yaaw-core/runtime/dispatch-failures.json` only after Orchestrator has re-inspected durable reality. Count only child execution failures with no durable progress on the unchanged handoff basis: worker failure, interruption, no response, or an unusable/illegal result. Do **not** count legal semantic results such as `REPAIR`, `REPLAN`, `BLOCKED`, or a real precondition result. A pre-execution `HOST_EXECUTION_PROFILE_UNAVAILABLE` or `HOST_ISOLATION_UNAVAILABLE` stop means no authority worker ran, so it must not increment the failure ledger or trigger Astra escalation.

When the threshold is reached for Implementer or Reviewer, prefer the role-specific fallback named worker on the next dispatch. It receives the exact same semantic role and handoff; only the host execution capability/model changes. Never reuse an Implementer context as Reviewer.

## Runtime modes

### auto
1. Resolve the selected authority's required execution profile.
2. Prefer its exact named YAAW worker.
3. If named selection is unavailable before child creation, inspect the generic baseline.
4. For each mismatch, use an explicit spawn override only when the active spawn schema exposes that exact control.
5. Execute generic only when the resulting model and reasoning are both guaranteed equivalent to the required profile.
6. If generic cannot preserve the profile, execute inline only when the current inline/root profile is equivalent.
7. Otherwise return `BLOCKED:HOST_EXECUTION_PROFILE_UNAVAILABLE`.
8. If a child was created and then failed/interrupted, do not try another mechanism blindly. Return to YAAW reality inspection first.

### isolated-required
Use the same named-then-generic fidelity checks, but never execute inline.

- If the host exposes no isolated spawning mechanism at all, return `BLOCKED:HOST_ISOLATION_UNAVAILABLE`.
- If isolation exists but the available isolated mechanism cannot guarantee the required model/reasoning profile, return `BLOCKED:HOST_EXECUTION_PROFILE_UNAVAILABLE`.

### inline
Do not spawn YAAW authority workers. Execute the selected handoff in the current/root context using canonical YAAW role/workflow contracts.

Inline mode is an explicit user choice and therefore does **not** provide per-role model isolation. Choose `auto` or `isolated-required` when role-specific model/reasoning assignments must be enforced.

The primary and Astra capability-fallback profiles use exactly the same fidelity rules. If fallback selects Astra/high, no generic or inline mechanism may silently substitute another profile.

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
