# Expertise: security

## Description
Specialist authentication, authorization, trust-boundary, secret, input-validation, and abuse-case guidance. It grants no workflow authority.

## Required context
Relevant trust boundaries, sensitive data paths, authentication/authorization mechanisms, project security rules, and changed interfaces.

## Rules
Planner identifies trust boundaries and security invariants. Implementer enforces server-side authorization/input handling and avoids secret/data exposure. Reviewer checks negative paths and actual enforcement rather than assuming the intended control exists.

## Anti-patterns
Client-only authorization, security by convention, logging secrets/tokens, broad trust of external input, or silently weakening an accepted invariant.

## Verification expectations
Negative authorization cases, boundary/input failure cases, secret/data exposure review, and regression evidence for security-sensitive behavior.
