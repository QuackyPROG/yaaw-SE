# Artifact Contracts

Durable workflow output must have a registered artifact type and canonical destination before mutation.

## Resolution order

1. Identify the active public skill.
2. Read its local `## Artifact contract` section.
3. Resolve `contracts.skills.<id>` in `.agents/artifacts.json`.
4. Resolve the semantic authority role through the skill, artifact registry, `.agents/authority.json`, and current contract.
5. Resolve the artifact type's canonical locator, template, producer, and mutation authority.
6. Resolve path ownership through `.agents/ownership.json` when the locator points to repository paths or contract-owned code.
7. If the type, destination, owner, or authority cannot be resolved, stop and report an artifact-contract gap. Do not invent a folder.

## Invariants

- Named agent profiles are not part of v2; `.agents/agents/` and `.codex/agents/` must not exist.
- Authority-role IDs are policy principals, not personas or profile files.
- No ad-hoc durable artifact destinations.
- The primary artifact remains the canonical state/index; large evidence may use only the registered overflow location and must be linked from the primary artifact.
- Path ownership does not automatically grant semantic mutation authority. For example, `tickets/**` is path-owned by orchestration/planning authorities, while review may update only the registered QA artifact/section.
- Existing canonical docs are updated in place through `CANONICAL_DOC_UPDATE`; do not create duplicate memory files.
- Domain packs may extend artifact types/contracts and concrete product ownership, but must not silently redefine generic artifact IDs.
- Completed work/history is never cosmetically rewritten to simplify a changed plan.
