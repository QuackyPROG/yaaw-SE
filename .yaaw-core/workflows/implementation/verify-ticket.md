# Verify ticket

## Purpose
Produce reproducible implementation evidence without self-accepting the ticket.

## Inputs
Ticket requirements/tests, changed surface, project tooling/rules, current repository identity.

## Procedure
1. Run every test/check required by the ticket.
2. Add targeted regression checks justified by the changed surface.
3. Record commands, exit/result, relevant checks, ticket/spec revisions, and exact repository identity in `.yaaw/evidence/EVIDENCE-TASK-NNN-VK.json` using the evidence schema.
4. Preserve failed evidence; do not rewrite it as success.

## Output
Evidence record(s). Verification never transitions a ticket to PASS; only Reviewer can accept.
