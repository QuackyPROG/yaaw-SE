# Verify ticket

## Purpose
Produce reproducible implementation evidence without self-accepting the ticket.

## Inputs
Exact active ticket requirements/tests, changed surface, project tooling/rules, current repository identity, and the evidence write path supplied by handoff.

## Procedure
1. Run every test/check required by the ticket.
2. Add targeted regression checks justified by the changed surface.
3. Record commands, exit/result, relevant checks, ticket/spec revisions, and exact repository identity in the next immutable `.yaaw/evidence/<SPEC-ID>/<TASK-ID>-V<VERSION>.json` using the evidence schema.
4. Preserve failed evidence; never overwrite an earlier evidence version as success.
5. Return evidence identity/result to the calling Implementer workflow; do not mutate lifecycle state.

## Output
Immutable evidence record(s). Verification never accepts the ticket; only Reviewer can classify acceptance and only Orchestrator persists lifecycle.
