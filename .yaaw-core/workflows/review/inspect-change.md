# Inspect change

## Purpose
Build an evidence-grounded view of the actual implementation to review before historical memory can bias acceptance.

## Inputs
Current ticket/spec/product/engineering revisions, actual repository state, project rules, verification evidence, and relevant expertise.

## Procedure
1. Revalidate source revisions and reject stale review inputs.
2. Compute/record repository identity using `rules/repository-identity.md`.
3. Inspect actual diff/files/tests/evidence; ignore implementation summaries when they conflict with observed work.
4. Do not consult project memory during this primary inspection. If memory was injected by the host, quarantine it as advisory until the current evidence/criteria analysis is complete.
5. Identify acceptance criteria, failure paths, regressions, and domain-specific requirements that must be checked.

## Output
Review inspection tied to exact repository and contract identity, independent of project-memory recollection.

## Project publication inspection

Inspect the exact publishable base..head commit range, publishable diff, verification evidence, and `yaaw.repository-identity/v2`. Do not treat protected local YAAW files as implementation changes. Any application identity mismatch between evidence, handoff, and current repository is a stale-review condition.
