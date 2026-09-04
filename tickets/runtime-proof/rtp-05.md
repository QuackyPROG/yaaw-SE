---yaaw-json
{"schema":"yaaw.ticket/v1","id":"RTP-05","kind":"DELIVERY","status":"BLOCKED","level":4,"parent":"INIT-RUNTIME-PROOF","owner":"orchestrator","blocked_by":["RTP-04"],"acceptance":["Audit the complete runtime-proof change set, reconcile maturity claims with actual executable and empirical evidence, and require full CI on the exact closing SHA before marking the initiative complete."],"qa":{"required":true,"profile":"HIGH_ASSURANCE"},"allowed_write":[".agents/**",".codex/**",".github/**","config/**","docs/**","evals/**","examples/**","scripts/**","tests/**","tickets/**","AGENTS.md","README.md"],"forbidden_write":["claiming external empirical success without observed evidence","initiative completion before full green CI"],"expected_change_surface":[".agents/**",".codex/**",".github/**","config/**","docs/**","evals/**","examples/**","scripts/**","tests/**","tickets/**","AGENTS.md","README.md"],"source_fingerprints":{},"risk":["agent-harness-control-plane","maturity-claim"],"side_effects":["repository"]}
---
# RTP-05: Runtime-proof integration audit

## What to deliver

Perform the whole-system audit after RTP-01 through RTP-04. Close contradictions, validate the exact implementation SHA and update maturity documentation to state precisely what is machine-enforced, runtime-dependent, CI-simulated and empirically observed.

## Acceptance criteria

- [ ] Complete diff is reviewed for duplicated policy, bypass paths, stale assumptions and accidental provider coupling.
- [ ] Full schema/semantic/state/policy/unit/eval/scope CI passes on the exact candidate.
- [ ] Maturity docs distinguish executable enforcement from provider containment and observed external workload evidence.
- [ ] Initiative status is COMPLETE only after preceding tickets are DONE and exact-SHA CI is green.
- [ ] No external benchmark success is invented to satisfy closeout.

## Preservation invariants

Completed prior hardening history remains immutable.

## Verification

Exact-SHA Agent Harness evidence plus final main-branch CI after closeout.
