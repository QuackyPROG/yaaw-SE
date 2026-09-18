# Inspect test validity

## Purpose
Determine whether the submitted tests/evidence can actually establish the ticket behavior.

## Inputs
Ticket verification mode, planned seams/oracles, immutable evidence phases, current tests, and final repository identity.

## Checks
Verify mode matches ticket; required phases exist; RED/REPRO was meaningful when required; test seam matches planned seam; oracle is independent; tests respond to the behavior and required negative/failure paths; final evidence is acceptance-ready. Detect tautologies, implementation-coupled expected values, mock-only proof, blind snapshots, and tests that could not catch the defect.

## Output
Test-validity observations only.
