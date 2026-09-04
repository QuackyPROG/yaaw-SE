---yaaw-json
{"schema":"yaaw.ticket/v1","id":"RTP-05","kind":"DELIVERY","status":"IN_PROGRESS","level":4,"parent":"INIT-RUNTIME-PROOF","owner":"orchestrator","blocked_by":["RTP-04"],"acceptance":["Audit the complete runtime-proof change set, reconcile maturity claims with actual executable and empirical evidence, and require full CI on the exact closing SHA before marking the initiative complete."],"qa":{"required":true,"profile":"HIGH_ASSURANCE"},"allowed_write":[".agents/**",".codex/**",".github/**","config/**","docs/**","evals/**","examples/**","scripts/**","tests/**","tickets/**","AGENTS.md","README.md"],"forbidden_write":["claiming external empirical success without observed evidence","initiative completion before full green CI"],"expected_change_surface":[".agents/**",".codex/**",".github/**","config/**","docs/**","evals/**","examples/**","scripts/**","tests/**","tickets/**","AGENTS.md","README.md"],"source_fingerprints":{"runtime_proof_base":"b2983793ba1e50415c99951f8d8a62a777fa9830","rtp04":"7a92adc0aef40d8d5f9aebf2feeb1c13218154d3","rtp04_ci":"33891024080","audit_base":"ea1277072908d6f17579a86f230124861ea8876c"},"risk":["agent-harness-control-plane","maturity-claim"],"side_effects":["repository"]}
---
# RTP-05: Runtime-proof integration audit

## What to deliver
Perform the whole-system audit after RTP-01 through RTP-04. Close contradictions, validate the exact implementation SHA and update maturity documentation to state precisely what is machine-enforced, runtime-dependent, CI-simulated and empirically observed.

## Acceptance criteria
- [x] Complete runtime-proof diff was reviewed for duplicated policy, bypass paths, stale assumptions and accidental provider coupling.
- [ ] Full schema/semantic/state/policy/unit/eval/scope CI passes on the exact final-audit candidate.
- [x] Maturity docs distinguish executable enforcement from provider containment and observed external workload evidence.
- [ ] Initiative status is COMPLETE only after preceding tickets are DONE and exact-SHA CI is green.
- [x] No external benchmark success is invented to satisfy closeout.

## Preservation invariants
Completed prior hardening history remains immutable. Runtime-proof failure/correction history remains visible. Maturity stays Beta unless actual external/runtime evidence justifies more.

## Allowed write scope
Whole harness surfaces only as needed for final audit corrections and durable closeout evidence.

## Forbidden write scope
No external empirical-success claim without observed evidence; no completion before exact-SHA green CI.

## Expected change surface
Final audit corrections in runtime gateway/evidence code and regressions, root/maturity/public documentation, semantic guards, and this initiative's durable state.

## Canonical sources
RTP-01 through RTP-04 artifacts, complete `b2983793...ea127707` Git history/diff, Agent Harness CI, runtime-gateway/evidence implementations, and maturity documentation.

## Stop and replan triggers
Any unresolved executable bypass, stale evidence, contradictory maturity claim, or failed exact-SHA CI.

## Audit findings

1. **Ticket-scope bypass** — the initial runtime gateway accepted caller-supplied `allowed_paths` as the effective path boundary. A caller could request `**` even when its durable ticket was narrower. The audit candidate makes ticket `allowed_write`/`forbidden_write` the scope ceiling and lets request scope only narrow it.
2. **Path-omission bypass** — local/dependency/artifact/product mutations could omit affected paths and therefore avoid deterministic path checks. The audit candidate fails closed when these mutations do not declare paths.
3. **Evaluation-provenance gap** — an observed external report was not bound to the exact grader/threshold manifest. The audit candidate records SHA-256 manifest fingerprints and requires lane ID + fingerprint equality before `EMPIRICAL` classification.
4. **Claim boundary** — README, AGENTS and maturity/evidence docs now explicitly state that no committed external empirical workload result exists and that host shell bypass prevention, authenticated role binding and OS/provider containment remain runtime-dependent.
5. **Semantic regression coverage** — core ownership and root-policy checks now include gateway, workload evidence, agent/workload runners and runtime-adapter surfaces, plus source-level invariants for ticket-bound scope and manifest-bound empirical proof.

## Implementation evidence
Audit candidate incorporates the two enforcement/provenance corrections above plus regression tests and maturity reconciliation. Pre-candidate runtime-proof relation was linear: `ea127707…` remained a fast-forward descendant of original runtime-proof base `b2983793…`; no completed history was rewritten. Exact candidate SHA/CI pending.

## QA disposition
HIGH_ASSURANCE required. Final acceptance depends on the complete Agent Harness at the exact candidate SHA; synthetic evals remain evaluator evidence only.

## QA result
Pending exact-SHA final-audit CI.

## Verification
Run every Agent Harness gate, including semantic/schema/runtime-adapter/workflow-state/policy/unit/adversarial/agent-loop/workload-comparison/scope validation, on the exact candidate.

## Delivery
IN_PROGRESS — audit corrections are ready for exact-SHA validation. Initiative remains ACTIVE until that evidence is green.
