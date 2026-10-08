# Framework immutability and consumer recovery

This document describes the current compact-kernel architecture.

## Ownership boundary
Package-owned framework content is exactly `.yaaw-core/system/**`. Normal semantic execution treats it as immutable. Installer update/repair may replace managed system bytes after hash/conflict handling.

Durable consumer truth is `.yaaw-core/project/**`: product, engineering, research, specs, tickets, reviews, evidence, and project rules. Ticket lifecycle state is the `status` field in each ticket frontmatter. There is no current durable project-wide state ledger.

Replaceable coordination is `.yaaw-core/runtime/**`: intent, observed state, exact handoff, and dispatch failures. Deleting this directory must never lose a semantic decision.

## Recovery rule
Evidence beats claims. On every continuation the runtime validates framework integrity, observes repository identity and durable artifacts, derives aggregate state, applies at most one legal evidence-backed lifecycle reconciliation, then routes exactly one next action.

A worker response is not project truth. After success, failure, interruption, or disappearance, Orchestrator re-observes artifacts before retrying or advancing.

## Lifecycle adoption
The authority that produces a fact retains semantic ownership:
- Planner owns ticket contract/admission decisions it is permitted to author.
- Implementer owns implementation evidence.
- Reviewer owns acceptance judgment.
- Orchestrator may physically patch only a ticket's `status` scalar when `kernel.yaml` authorizes that transition from current durable evidence.

Prior reviews/evidence remain immutable history. Stale acceptance is revoked by moving the ticket back to the appropriate trusted boundary; history is not rewritten.

## Project schema v3 migration
Legacy `project/state.json` is treated as a migration source only. Upgrade copies each valid lifecycle value into the corresponding ticket frontmatter, then removes only that legacy ledger and invalidates runtime caches. Product/engineering/spec/review/evidence content remains untouched.

## Framework incident recovery
If `.yaaw-core/system/**` differs from the installation manifest, semantic routing fails closed. Repair with the installer, preferably using `--conflict-policy backup-replace`, so modified managed bytes are preserved before restoration. Durable project memory is not blanket-replaced.
