# Expertise: testing

## Description
Specialist test design, regression strategy, verification scope, and evidence-quality guidance. It grants no workflow authority.

## Required context
Ticket acceptance criteria, changed surface, project test tooling/conventions, existing relevant tests, and known failure modes.

## Rules
Planner makes acceptance verifiable. Implementer runs required tests and adds targeted coverage justified by the change. Reviewer checks evidence quality and may run/require additional focused checks when acceptance cannot otherwise be established.

## Anti-patterns
Tests that only mirror implementation details, skipping failure paths, treating an unrun test suite as passing, or expanding into unrelated test cleanup.

## Verification expectations
Required tests executed, meaningful failure/regression coverage, reproducible commands/results, and evidence tied to repository identity.
