# Verify ticket

## Purpose
Produce reproducible implementation evidence without self-accepting the ticket.

## Inputs
Ticket requirements/tests, changed surface, project tooling/rules, current repository identity.

## Procedure
1. Run every test/check required by the ticket.
2. Add targeted regression checks justified by the changed surface.
3. For each materially relevant changeability principle from `.yaaw-core/rules/changeability.md`, verify the concrete property rather than a style preference. Examples include boundary mapping behavior, invalid-state rejection, decision logic independent of side effects, stable error identity, and focused-diff inspection.
4. Record commands, exit/result, relevant checks (including relevant changeability checks), ticket/spec revisions, and exact repository identity in `.yaaw/evidence/EVIDENCE-TASK-NNN-VK.json` using the evidence schema.
5. Preserve failed evidence; do not rewrite it as success.

## Output
Evidence record(s). Verification never transitions a ticket to PASS; only Reviewer can accept.
