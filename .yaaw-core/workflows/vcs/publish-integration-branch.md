# Publish integration branch

## Purpose

Publish one already-validated integration branch without exposing topic/worktree refs.

## Inputs

- successful `vcs.validate-publication`
- exact allowlisted source branch
- equal allowlisted remote destination

## Process

Use one explicit refspec for the allowed integration branch. Never use implicit push, `-u`, `--no-verify`, `--force`, `--force-with-lease`, wildcard refspecs, tag publication, or a topic/worktree source ref.

## Results

Return `PUBLISHED` with the remote integration identity or the exact push failure.
