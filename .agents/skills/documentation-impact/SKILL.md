---
name: documentation-impact
description: Use when a changed fact may require updating its canonical repository documentation or durable artifact.
---

# Documentation Impact

## Artifact contract

Canonical machine contract: `.agents/artifacts.json` -> `contracts.skills.documentation-impact`.

- Read: changed fact, source-of-truth hierarchy, `docs/index.md`, `.agents/ownership.json`, `.agents/artifacts.json`.
- Produce: `CANONICAL_DOC_UPDATE` only.
- Resolve the existing canonical owner/path and update it in place; this skill is specifically not permission to create a parallel memory artifact.
- If no canonical owner/type exists, return `ARTIFACT_CONTRACT_GAP` for Orchestrator/Planner resolution instead of inventing a folder.

For each material change ask:

1. Architecture/constraints/consequences changed? -> registered ADR/architecture artifacts.
2. Intended user/system behavior changed? -> active SPEC.
3. Initiative decisions/frontier/fog changed? -> initiative map/tickets/PLAN_DELTA.
4. Stable subsystem fact/procedure changed? -> existing scoped canonical doc.
5. Truth is executable? -> prefer code/tests as higher authority and keep prose concise.

Do not paste transcripts or implementation diaries into durable docs. Link to the owning artifact and record only the decision/fact necessary for future work. Check for stale contradictory lower-authority docs in the affected scope.
