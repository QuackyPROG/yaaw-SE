# Inspect change

## Purpose
Build an evidence-grounded view of the actual implementation to review.

## Inputs
Current ticket/spec/product/engineering revisions, repository status `READY` plus exact workspace-scoped identity, actual repository state, project rules, verification evidence, and relevant expertise.

## Procedure
1. If repository status is not `READY`, return `BLOCKED`/`PRECONDITION_UNSATISFIED:REPOSITORY_IDENTITY_UNAVAILABLE`; do not review against ambiguous identity.
2. Revalidate source revisions and reject stale review inputs.
3. Compute/record repository identity using `rules/repository-identity.md` and the canonical utility.
4. Inspect actual diff/files/tests/evidence; ignore implementation summaries when they conflict with observed work.
5. Identify acceptance criteria, failure paths, regressions, and domain-specific requirements that must be checked.

## Output
Review inspection tied to exact repository and contract identity.

## Repository basis
Obtain repository identity from `.yaaw-core/system/tools/repository-identity.mjs`. Do not whitelist `.codex`, `.agents`, provider directories, or project/application files merely by path ownership. Only replaceable `.yaaw-core/runtime/**` coordination caches are excluded by the canonical identity algorithm so orchestration cannot invalidate its own handoff basis.
