# Integrate local work

## Purpose

Perform local-only integration of reviewed topic work into an allowed integration branch.

## Inputs

- successful integration inspection
- exact reviewed head
- configured integration branch

## Process

Fast-forward when possible. Never publish the topic branch, set its upstream, force history, or treat a history-rewritten commit as previously accepted. If integration changes identity, require re-verification and fresh review before publication.

## Results

Return the new local integration identity and whether acceptance remains current.
