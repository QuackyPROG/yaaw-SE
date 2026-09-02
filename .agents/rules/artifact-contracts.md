# Artifact Contracts

Durable workflow output must have a registered artifact type and canonical destination before mutation.

## Resolution order

1. Identify the active registered agent and skill.
2. Read their local `## Artifact contract` section.
3. Resolve the matching contract in `.agents/artifacts.json`.
4. Resolve the artifact type's canonical locator, template, producer, and mutation authority.
5. Resolve path ownership through `.agents/ownership.json` when the locator points to repository paths or contract-owned code.
6. If the type, destination, owner, or authority cannot be resolved, stop and report an artifact-contract gap. Do not invent a folder.

## Invariants

- No ad-hoc durable artifact destinations.
- The primary artifact remains the canonical state/index; large evidence may use only the registered overflow location and must be linked from the primary artifact.
- Path ownership does not automatically grant semantic mutation authority. For example, `tickets/**` is path-owned by Orchestrator/Planner, while QA may update only the registered QA artifact/section.
- Existing canonical docs are updated in place through `CANONICAL_DOC_UPDATE`; do not create duplicate memory files.
- Domain packs may extend artifact types/contracts and concrete product ownership, but must not silently redefine generic artifact IDs.
- Completed work/history is never cosmetically rewritten to simplify a changed plan.
