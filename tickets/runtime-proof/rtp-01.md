---yaaw-json
{"schema":"yaaw.ticket/v1","id":"RTP-01","kind":"DELIVERY","status":"IN_PROGRESS","level":4,"parent":"INIT-RUNTIME-PROOF","owner":"orchestrator","blocked_by":[],"acceptance":["Mutating dispatches and command/tool side effects can be admitted through one executable gateway that composes ticket/controller, authority, lease, scope and security policy and fails closed when required context/capability is absent.","Tests prove denied/bypass paths cannot be converted into successful mutation decisions merely by declaring lower risk or omitting admission context."],"qa":{"required":true,"profile":"HIGH_ASSURANCE"},"allowed_write":["scripts/yaaw/**","scripts/yaaw_cli.py","config/**","tests/harness/**","docs/workflow/**",".agents/**","tickets/runtime-proof/**","docs/initiatives/runtime-proof/**"],"forbidden_write":["production/provider execution","fabricated provider capability"],"expected_change_surface":["scripts/yaaw/**","config/**","tests/harness/**","docs/workflow/**"],"source_fingerprints":{"main_base":"b2983793ba1e50415c99951f8d8a62a777fa9830","plan_fix":"12d7c47ab36c71ab9bd76c92911490b4974d25f6"},"risk":["agent-harness-control-plane","security-boundary"],"side_effects":["repository"]}
---
# RTP-01: Hard runtime gateway

## What to deliver
Create an executable runtime gateway that is the canonical admission surface for mutating dispatch and action execution. It must compose existing deterministic policy instead of duplicating it in prompts.

## Acceptance criteria
- [ ] Gateway models an admitted action with work/ticket identity, actor/role, worktree, command/action, declared effects, scope and required capabilities.
- [ ] Mutating dispatch is controller-admitted before execution authorization.
- [ ] Command/action authorization uses inferred risk and orthogonal network/repository/production capabilities.
- [ ] Scope/ownership/authority requirements fail closed when required information is absent.
- [ ] Dry-run decision objects explain denial without executing side effects.
- [ ] Regression tests cover under-declared commands, unknown ticket/owner, stale source, lease collision, scope escape and missing capabilities.

## Preservation invariants
Do not embed provider-specific model identity or create an alternate workflow state machine.

## Allowed write scope
`scripts/yaaw/**`, `scripts/yaaw_cli.py`, `config/**`, `tests/harness/**`, `docs/workflow/**`, `.agents/**`, and this initiative's durable artifacts.

## Forbidden write scope
No production/provider execution and no fabricated provider capability/evidence.

## Expected change surface
Runtime admission/security modules, focused tests, policy/config/docs needed to expose the gateway.

## Canonical sources
`AGENTS.md`, `.agents/router.json`, existing controller/security/authority/ownership/scope code, and this initiative map.

## Stop and replan triggers
Controller/security semantics would need incompatible duplication; runtime cannot enforce a required boundary; or implementation requires provider-specific workflow authority.

## Implementation evidence
Implementation candidate adds controller preflight plus `scripts/yaaw/runtime_gateway.py`, focused gateway tests and explicit documentation of gateway-enforced versus instruction-only host runtimes. CI evidence pending.

## QA disposition
HIGH_ASSURANCE required; candidate is not DONE until full Agent Harness is green.

## QA result
Pending exact-SHA CI.

## Verification
Run the complete Agent Harness plus focused gateway/security/controller tests.

## Delivery
IN_PROGRESS — implementation candidate being validated; no provider/production execution performed.
