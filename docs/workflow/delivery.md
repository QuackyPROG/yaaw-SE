# Delivery and Integration

The generic harness does not force one Git branching model. A consuming domain pack may use direct feature branches, persistent staging, trunk-based integration, release branches, or another documented strategy.

Regardless of strategy, delivery requires these invariants:

1. identify the exact comparison/diff being delivered;
2. confirm the originating contract/ticket state;
3. run required targeted/broad verification;
4. obtain required independent QA or explicit `QA_NOT_REQUIRED_BY_ROUTE`;
5. satisfy configured CI gates;
6. preserve coherent, reviewable commit history;
7. never infer production/provider state solely from local success;
8. require explicit human authority for protected promotion when project policy requires it.

Parallel implementation branches/worktrees converge through an explicit integration owner. Resolve conflicts by source-of-truth intent, not by choosing whichever side is newer.

A green CI run is evidence, not a substitute for a required product/production approval.
