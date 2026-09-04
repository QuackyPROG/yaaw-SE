# Repository, tracker, provider and multi-repo integrations

External systems provide **observed evidence**, not semantic authority. yaaw-SE keeps project intent and mutation authority in its registered human/agent contracts even when a host reports CODEOWNERS, branch rules, issue state or deployment state.

## Repository-native signals

`repository_signals.py` can normalize CODEOWNERS and ruleset data. CODEOWNERS uses last-match evidence when local fallback parsing is needed; host-resolved owner data is preferable when available. The resulting owners are compared with yaaw ownership and may raise a conflict for investigation, but they never overwrite `.agents/ownership.json` or an active domain-pack owner silently.

Rulesets are normalized into required checks, review counts and force-push/deletion restrictions. Delivery must satisfy the observed repository policy, but observing a permissive repository does not grant yaaw product/release authority.

## Domain-pack lifecycle

Domain packs declare `pack_version` as `MAJOR.MINOR.PATCH` and harness compatibility. Installation is dry-run-first through `yaaw domain-pack <source>`. `--write` atomically writes `.yaaw/domain-pack.json` and `.yaaw/domain-pack.lock.json`.

The lock records pack name/version, content digest, source and harness version. Updates fail closed when harness compatibility is not met. Downgrades and replacing a different installed pack require explicit flags; equal content is a NOOP.

## Tracker/provider adapters

Adapter contracts declare a stable identity field and are required to be `EVIDENCE_ONLY`. Every normalized observation carries stable ID, observed state, timestamp, source reference and freshness token. A provider response can prove an observed state such as OPEN or DEPLOYED; it cannot create product approval or release authority.

## Coordinated cross-repository work

A `yaaw.change-set/v1` document lists repository changes with stable local IDs, work IDs, base/head refs, dependencies, required checks and optional release environment. The controller validates missing dependencies and cycles and computes a repository-change frontier. Optional `release_order` must contain every change exactly once and respect dependencies.

`yaaw change-set <file> --completed <ids...>` inspects the currently ready repository changes without performing provider mutations.
