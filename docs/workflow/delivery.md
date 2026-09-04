# Delivery and Integration

The generic harness does not force one Git branching model. A consuming domain pack may use direct feature branches, persistent staging, trunk-based integration, release branches, or another documented strategy.

Regardless of strategy, delivery requires these invariants:

1. identify the exact comparison/diff being delivered;
2. confirm the originating contract/ticket and referenced PRD/spec/ADR sources are still current;
3. compare expected and actual change surface and explain deviations;
4. confirm preservation invariants remain true;
5. run required risk-weighted targeted/broad verification;
6. obtain required independent QA or explicit `QA_NOT_REQUIRED_BY_ROUTE`;
7. satisfy configured CI gates when CI is part of the admitted delivery route;
8. preserve coherent, reviewable, reasonably revertible commit history;
9. never infer production/provider state solely from local success;
10. require explicit human authority for protected promotion when project policy requires it.

## Commit and integration loop

For material DELIVERY work:

```text
admit fresh ticket
→ implement one cohesive outcome
→ targeted verification
→ inspect actual diff / preservation / scope drift
→ independent QA when required
→ evaluate release_engineer_required(...)
   ├─ false: finalize coherent verified local commit/record
   └─ true: Release Engineer admits serial delivery
            → create coherent ticket-linked commit/integration result
            → run/observe configured CI and integration gates
            → record SHA + observed provider/environment state
→ advance the ready frontier when delivery state permits
```

Release Engineer is conditional. `scripts/yaaw/delivery.py::release_engineer_required` requires it for multi-branch work, required CI, promotion, or non-local environment semantics. Trivial/local verified outcomes should not acquire a release stage merely for ceremony.

When Release Engineer is required, it owns the coherent ticket-linked commit/integration result and serial integration evidence after verification/QA admission. It does not repair product implementation. For a route where Release Engineer is not required, the Orchestrator may finalize the already-verified local outcome according to repository policy.

A commit is a verified outcome, not a diary entry. Prefer ticket-aligned commits when cleanly possible. Split independent outcomes; combine inseparable edits. Avoid both one-commit-per-trivial-edit noise and unrelated mega-commits.

A useful commit body records what materially changed, why it exists, the verification actually run, and the ticket/work identity. The durable ticket remains the canonical place for deeper reasoning and evidence.

Parallel implementation branches/worktrees converge through an explicit integration owner. Resolve conflicts by observed truth plus accepted intent, not by choosing whichever side is newer.

A green CI run is evidence, not a substitute for a required product/production approval.
