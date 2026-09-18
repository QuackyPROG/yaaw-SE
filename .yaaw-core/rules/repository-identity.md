# Repository identity

Acceptance and recovery bind to **application/publication identity**, not the local YAAW control plane.

## Canonical identity

Repository identity uses schema `yaaw.repository-identity/v2` and records `head_commit`, `branch`, `dirty_publishable`, `publishable_worktree_digest`, and optional integration/base identity.

The deterministic VCS path classifier decides whether a path participates. No reviewer, role, hook, bootstrap routine, or workflow keeps a competing path list.

## Excluded control-plane state

Protected YAAW local artifacts do not change application identity: `.yaaw/**`, YAAW-owned planning/spec/rule documents, project-local YAAW control-plane files, local Git guard metadata, VCS config, reviews, evidence, runtime handoffs, and state.

A project workspace with only YAAW-local mutation has `dirty_publishable = false`.

## Included publication state

The digest covers only publishable tracked/staged/untracked application changes relative to HEAD, including path identity and file content/diff sufficient to distinguish the exact state.

## Review immutability

Reviewer PASS belongs to the exact publishable base/head identity. Amend, rebase, squash, cherry-pick, merge conflict repair, or any application change that creates a different accepted head makes the prior review stale. Reverify and review again.

Writing YAAW-local state does not invalidate review.
