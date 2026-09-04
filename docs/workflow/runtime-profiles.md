# Runtime Profiles and Operating Modes

Engineering semantics do not name a model. A consuming runtime supplies model candidates with a family, maximum reasoning level and capability set; yaaw-SE selects only candidates that meet the role/profile requirement.

A fallback is **not** allowed merely because the preferred model is unavailable. If no candidate meets required reasoning/capabilities, the dispatch is blocked. This prevents an outage from silently downgrading a high-assurance Planner, Implementer or QA role.

For high-assurance QA, the selector chooses a different model family from the Implementer when an eligible distinct family is available. Fresh context and model-family diversity reduce different forms of correlated error; neither substitutes for executable evidence.

## Operating modes

`lightweight`, `standard` and `strict` are policy envelopes, not alternate authority systems.

- `lightweight` minimizes optional durable ceremony for L0/L1 but cannot weaken route-mandated QA or risk floors.
- `standard` is the generic default.
- `strict` makes L1 durable, raises the QA floor to independent review, disables optional Release Engineer skipping and defaults network access to deny-unless-allowed.

A mode may strengthen gates. It may never lower a route's risk/QA result, grant semantic authority, or turn missing safety evidence into a waiver.

`config/runtime-adapters.json` declares which execution adapters implement the generic runtime contract. Adapter-specific validators remain responsible for native configuration semantics while the generic validator checks role/capability parity.
