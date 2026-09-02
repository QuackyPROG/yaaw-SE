# Thread Lifecycle and Concurrency

## Default: fresh

Fresh contexts reduce hidden assumption carryover. Repository artifacts are the continuity mechanism.

### Recommended role lifecycle

- Orchestrator: persistent root for the active session/initiative when useful.
- Planner: may persist within one initiative while source-of-truth assumptions remain current.
- Discovery: may persist while evidence scope and freshness remain current.
- Implementer: fresh per delivery contract; at most one reuse for a repair against an unchanged contract.
- QA: always fresh.
- Release Engineer: fresh/serial by delivery event.

## Reuse gate

Reuse only when all remain true: same role, same initiative, compatible contract, same owner/subsystem, same acceptance, current evidence, no material architecture/trust/source-of-truth change, and context is still clean enough to summarize reliably.

Invalidate reuse on scope promotion, owner change, material acceptance change, architecture/migration change, security/provider/trust change, stale/contradicted evidence, incompatible new contract, or polluted context.

## Delegation topology

Only the root Orchestrator delegates. Child agents do not recursively spawn children or coordinate peers. Cross-role needs return to the root as bounded handoffs.

## Parallelism

Parallelize independent evidence gathering and truly independent tickets. One worktree has one active writer. Multiple writers require isolated worktrees/branches and explicit integration ownership.

Do not use agent count as a goal. Parallelism is useful only when dependency structure permits it.

## Checkpoint rule

Before dependent work begins or a useful thread retires, write material decisions/evidence into the canonical repository artifact. A thread UUID or transcript is never the only copy of project-critical knowledge.
