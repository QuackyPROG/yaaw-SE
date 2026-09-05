# Implement workflow

Implement exactly one admitted bounded contract.

1. Validate ticket/contract freshness, controller admission, writer lease, ownership, allowed/forbidden writes, acceptance, preservation invariants, and verification seam.
2. Load the smallest relevant repository context and only applicable `_yaaw-core` modules.
3. Make the smallest cohesive implementation that satisfies the contract. Local coding decisions are allowed; project/product/architecture direction is not silently widened.
4. Run narrow executable verification appropriate to the contract and loaded modules.
5. Audit actual diff against allowed scope and preservation requirements.
6. Return structured implementation evidence.

If the implementation is simply wrong under a valid contract, a `REPAIR` review may return the unchanged ticket for one bounded repair cycle. If new evidence invalidates architecture, acceptance, ownership, trust/migration assumptions, or requires material scope expansion, return `REPLAN`/`STOP_AND_REPLAN` with minimum discriminating evidence rather than inventing a solution graph.
