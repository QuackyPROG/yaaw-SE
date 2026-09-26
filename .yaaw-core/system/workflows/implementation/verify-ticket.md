# Verify ticket

## Purpose
Produce reproducible implementation evidence without self-accepting the ticket.

## Inputs
Exact handoff, reconciled state, ticket requirements/tests, changed surface, project rules/tooling, and current repository identity.

## Procedure
1. Run every ticket-required test/check and justified targeted regressions.
2. Verify materially relevant changeability properties as concrete behavior.
3. After verification commands finish, capture the canonical repository identity.
4. Write a new immutable `.yaaw-core/project/evidence/EVIDENCE-TASK-NNN-VK.json` using `yaaw.evidence/v3`.
5. Set `kind: implementation_verification` and exactly one result: `PASS`, `FAIL`, or `BLOCKED`.
6. Preserve failed records; fixes produce a later evidence record.
7. If verification proves implementation materially incomplete, return `IMPLEMENTATION_INCOMPLETE` to Orchestrator rather than silently reimplementing in this verification workflow.

## Output
One explicit verification result. Only a current PASS record can authorize review admission; evidence-file existence alone never does.
