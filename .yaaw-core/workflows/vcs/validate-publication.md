# Validate publication

## Purpose

Run the final fail-closed audit before any remote update.

## Inputs

- consumer boundary health
- source and destination refs
- outgoing commit range
- current verification/review basis
- publish-branch allowlist

## Process

Verify consumer mode, healthy guards, allowed equal source/destination integration refs, no upstream policy violation, no protected staged path, no protected path in any outgoing commit, no YAAW-internal commit message, current verification, and current review identity. Reject non-fast-forward publication and unresolved remote-policy conflicts.

## Results

Return `PUBLICATION_ALLOWED` or `PUBLICATION_NOT_ALLOWED` with a deterministic reason.
