---
name: documentation-impact
description: Decide which durable repository artifact owns a changed fact and update the minimum canonical documentation without creating duplicated memory.
---

# Documentation Impact

For each material change ask:

1. Did architecture/constraints/consequences change? -> ADR/architecture docs.
2. Did intended user/system behavior change? -> active spec.
3. Did initiative decisions/frontier/fog change? -> initiative map/tickets/PLAN_DELTA.
4. Did a stable subsystem fact/procedure change? -> scoped canonical doc.
5. Is the truth executable? -> prefer code/tests as highest authority and keep prose concise.

Do not paste transcripts or implementation diaries into durable docs. Link to the owning artifact and record only the decision/fact necessary for future agents/humans.

After changes, look for stale contradictory lower-authority docs in the affected scope.
