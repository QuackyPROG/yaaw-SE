# Domain Packs

yaaw-SE is intentionally incomplete about a consuming product. The reusable harness owns engineering control; the project owns domain facts.

A **domain pack** should define:

- repository map and subsystem boundaries;
- concrete path ownership and risk boundaries;
- language/framework/build/test commands;
- project-specific work shapes and escalation triggers;
- architecture and domain terminology;
- specialist agents/skills only where generic roles are insufficient;
- provider/deployment rules;
- branch/release/promotion strategy;
- security/compliance constraints;
- runtime/model profile preferences.

## Extension rules

1. Extend the generic router; do not fork its invariants casually.
2. Register every specialist in `.agents/catalog.json` and every owned path in `.agents/ownership.json`.
3. Keep specialist skills procedural and narrowly triggered.
4. Keep product facts in project docs/code, not embedded into generic role prompts.
5. Add machine validation for any policy whose violation can be detected deterministically.
6. Treat unregistered ownership as `UNKNOWN_OWNER` until discovered and recorded.

The goal is `GENERIC ENGINEERING HARNESS + PROJECT DOMAIN PACK`, not a universal prompt containing every project's knowledge.
