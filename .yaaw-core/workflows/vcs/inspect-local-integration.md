# Inspect local integration

## Purpose

Determine whether a reviewed local topic branch can be integrated without changing the accepted application identity.

## Inputs

- reviewed base/head identity
- local topic branch
- configured integration branch
- current branch graph

## Process

Prefer a fast-forward of the integration branch to the exact reviewed head. If the integration branch moved such that merge, rebase, squash, or cherry-pick would create a new application identity, mark the existing review stale and route through fresh verification/review after local integration.

## Results

Return `FAST_FORWARD_ELIGIBLE`, `REVIEW_INVALIDATED_BY_INTEGRATION`, or a typed operational blocker.
