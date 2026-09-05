# Artifact Contracts

Artifact contracts remove destination ambiguity from the workflow. They are intentionally separate from path ownership.

## Two registries, two questions

- `.agents/ownership.json`: **Which semantic authority owns this repository path/subsystem?**
- `.agents/artifacts.json`: **What workflow artifact is being produced, where is its canonical location, which authority role may produce/mutate it, and which template applies?**

Authority-role identifiers such as `planner`, `implementer`, and `qa` are machine-policy principals. They are not named agent profiles and do not imply files under `.agents/agents/` or `.codex/agents/`.

## Resolution algorithm

Before creating or relocating durable output:

1. identify the active public skill;
2. read its local `## Artifact contract` section;
3. resolve `contracts.skills.<id>` in `.agents/artifacts.json`;
4. resolve the semantic authority role from the skill, artifact type, and `.agents/authority.json`;
5. select the output artifact type from `artifact_types`;
6. use its `canonical_locator` and registered template;
7. when the locator points into product/domain paths, resolve concrete path ownership through `.agents/ownership.json` and the current work contract;
8. if the artifact has `overflow_locator`, use it only when primary inline storage would become unwieldy, then link overflow evidence from the primary artifact;
9. if any type, destination, producer, mutator, owner, authority, or template is unresolved, stop with `ARTIFACT_CONTRACT_GAP` rather than inventing a path.

## Canonical artifact routing

The registry defines routes for task profiles, specs, initiative maps, PLAN_DELTA records, ADRs, architecture docs, the three ticket kinds, ticket state, discovery evidence, contract-scoped product mutation, implementation handoffs, QA reports, delivery records, and updates to existing canonical documentation.

The registry is the machine authority; template prose and examples must not contradict it.

## Primary vs overflow artifacts

Ticket-local evidence should stay with its ticket when reasonably sized. Large evidence may move to the registered initiative overflow location, but the ticket remains the canonical index/state and must link the overflow file.

This prevents evidence directories from becoming an unindexed second task system.

## Mutation authority

`allowed_producers` answers which semantic authority role may originate an artifact type. `allowed_mutators` answers which role may update it after creation. The active public skill contract narrows this further.

Authority is conjunctive: the skill, semantic authority role, artifact type, field-level authority, current ticket/contract scope, and path ownership must all permit the mutation.

A generic fresh execution context does not create a new authority identity. It executes one admitted skill under the authority already resolved by repository policy.

## Domain packs

A consuming repository should extend path ownership for real product directories and may add specialist artifact types/contracts. It should not silently change generic artifact IDs such as `PLAN_DELTA`, `QA_REPORT`, or `DELIVERY_TICKET`; a semantic change should be versioned or explicitly migrated.

## Validation

`scripts/validate_workflow_assets.py` checks that:

- router/catalog/ownership point to the artifact registry;
- the public skill surface is exactly the locked five-skill set;
- there is no registered named-agent inventory and no `.agents/agents/` or `.codex/agents/` profile directory;
- every public skill has exactly one machine-readable skill artifact contract;
- every local skill file contains an `## Artifact contract` section pointing to `.agents/artifacts.json`;
- every produced/mutated artifact type exists;
- artifact owners/producers/mutators are registered semantic authority roles;
- registered templates exist.

CI runs this validator, so incomplete artifact routing is a harness failure rather than a documentation nit.
