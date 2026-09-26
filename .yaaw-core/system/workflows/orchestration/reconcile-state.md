# Reconcile state

## Purpose
Apply exactly one highest-priority evidence-backed state adoption or legal lifecycle transition.

## Inputs
Current observed-state snapshot and its `reconciliation` object from the production orchestration engine.

## Procedure
1. Require framework integrity `HEALTHY`.
2. Run `node .yaaw-core/system/tools/orchestration-runtime.mjs --workspace <WORKSPACE_ROOT> --reconcile-one`.
3. Apply only the one reconciliation returned by the engine; do not batch multiple discovered facts.
4. Increment `transition_sequence` exactly once and persist provenance.
5. Return immediately to `orchestration.route` so reality is observed again.

Examples include ledger sync, accepted-spec adoption, ticket registration, implementation-start adoption, PASS-verification adoption, review-result adoption, acceptance invalidation, and project completion sync.

## Output
One reconciled mutation or a typed blocker. No semantic product/engineering/implementation/acceptance judgment is invented here.
