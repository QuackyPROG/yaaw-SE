---yaaw-json
{
  "schema": "yaaw.initiative-map/v1",
  "id": "INIT-RUNTIME-PROOF",
  "level": 4,
  "status": "COMPLETE",
  "spec_ref": null,
  "prd_ref": null,
  "revision": 12
}
---
# Runtime Enforcement and Empirical Proof

## Destination

Close the remaining maturity gap between yaaw-SE's deterministic control-plane design and real stochastic agent execution. The result makes deterministic admission executable for gateway-wired runtimes, produces correlated traces, provides repeated agent-loop evaluation machinery, and distinguishes evaluator conformance from actual external empirical evidence.

## Completion state

The planned `RTP-01` through `RTP-05` ladder is complete. The final audit found and corrected two material gaps rather than accepting the first green implementation: caller-controlled runtime scope/path omission, and empirical reports not being bound to the exact evaluation manifest.

## Preserved invariants

- LLMs retain engineering judgment; software enforces deterministic invariants.
- Root-only delegation and one writer per worktree remain unchanged.
- Repository artifacts remain canonical memory; runtime traces are evidence, not product intent.
- Missing runtime capability blocks high-assurance work instead of silently downgrading.
- Prompt instructions remain defense in depth, never a substitute for executable admission when a gateway is available.
- External/synthetic evaluation evidence cannot silently promote itself into a maturity claim.

## Completed ladder

1. `RTP-01` — DONE: executable runtime gateway and reserving admission.
2. `RTP-02` — DONE: correlated, redacted gateway/action tracing and diagnostic metrics.
3. `RTP-03` — DONE: provider-neutral repeated agent-loop trials, separate outcome/trace graders and stochastic metrics.
4. `RTP-04` — DONE: external workload provenance, baseline/governed comparison and generic command runtime adapter contract.
5. `RTP-05` — DONE: whole-system audit, bypass correction and maturity reconciliation.

## Final audit corrections

- Durable ticket `allowed_write` / `forbidden_write` is the runtime gateway scope ceiling; request scope may only narrow it.
- Filesystem/dependency, artifact and product mutations require affected-path declarations for deterministic admission.
- Empirical workload evidence requires the expected lane manifest ID and SHA-256 fingerprint to match the observed report.
- Synthetic CI explicitly asserts `UNPROVEN`, even when the governed fixture numerically outperforms its baseline.
- Root/public maturity language now states the remaining host-runtime boundary rather than presenting gateway code as blanket sandbox containment.

## Evidence

- runtime-proof starting main: `b2983793ba1e50415c99951f8d8a62a777fa9830`;
- RTP-01 implementation / CI: `68405b4652ea3a547a48fb9939e3cf130ba5cbae` / `33888436897`;
- RTP-02 implementation / CI: `d0b85f201fa743602a1285a163290e7ecc10cee6` / `33888918032`;
- RTP-03 implementation / CI: `f70108256049eabb86772585ca55e7930b605ec3` / `33889727104`;
- RTP-04 implementation / CI: `7a92adc0aef40d8d5f9aebf2feeb1c13218154d3` / `33891024080`;
- final audit implementation / CI: `386745a4420abb3b874409728e1ada4a1f39278b` / `33892346135`;
- validated VERIFYING state / CI: `0e0c94fff96cd14d688f2333255257a97f4e34f7` / `33892513677`;
- audit candidate relation to runtime-proof base: 11 commits ahead, 0 behind, merge base equal to `b2983793…`.

The terminal COMPLETE commit itself is additionally required to pass the normal post-closeout `main` Agent Harness. That external CI observation is not self-referentially embedded into this commit; a failed closeout run would become new corrective work rather than a rewrite of DONE history.

## Maturity boundary

Current public maturity remains **Beta / self-hosting control plane**. There is no committed external `EMPIRICAL` workload result. The gateway provides hard deterministic admission only where a consuming runtime physically routes mutation through it or an equivalent native non-bypassable hook. Authenticated runtime-role binding, OS/filesystem syscall containment, network/credential isolation and production-provider authority remain runtime/provider responsibilities.

## Frontier

No remaining work in this initiative. New defects, empirical workload campaigns or stronger runtime containment integrations are new durable work rather than amendments to completed RTP history.

## Recovery / historical record

The initial plan failure, all phase commits, final-audit findings and fixes remain in linear Git history. Chat history is not required to reconstruct why the architecture changed or what evidence justified completion.
