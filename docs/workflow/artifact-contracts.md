# Artifact Contracts

Artifact contracts remove destination ambiguity from the workflow. They are intentionally separate from path ownership.

## Two registries, two questions

- `.agents/ownership.json`: **Who owns this repository path/subsystem?**
- `.agents/artifacts.json`: **What workflow artifact is being produced, where is its canonical location, who may produce/mutate it, and which template applies?**

Both may be required. An Implementer can have permission to change a contract-owned source path without gaining authority to edit the ticket graph. QA can have authority to write a QA report section without owning the whole ticket tree.

## Resolution algorithm

Before creating or relocating durable output:

1. identify the registered agent and active skill;
2. read the local `## Artifact contract` section;
3. resolve the matching `contracts.agents.<id>` and `contracts.skills.<id>` entries in `.agents/artifacts.json`;
4. select the output artifact type from `artifact_types`;
5. use its `canonical_locator` and registered template;
6. when the locator points into product/domain paths, resolve concrete path owner through `.agents/ownership.json` and the current work contract;
7. if the artifact has `overflow_locator`, use it only when primary inline storage would become unwieldy, then link overflow evidence from the primary artifact;
8. if any type, destination, producer, mutator, owner, or template is unresolved, stop with `ARTIFACT_CONTRACT_GAP` rather than inventing a path.

## Canonical artifact routing

The registry currently defines routes for task profiles, specs, initiative maps, PLAN_DELTA records, ADRs, architecture docs, the three ticket kinds, ticket state, discovery evidence, contract-scoped product mutation, implementation handoffs, QA reports, delivery records, and updates to existing canonical documentation.

The registry is the machine authority; template prose and examples must not contradict it.

## Primary vs overflow artifacts

Ticket-local evidence should stay with its ticket when reasonably sized. Large evidence may move to the registered initiative overflow location, but the ticket remains the canonical index/state and must link the overflow file.

This prevents evidence directories from becoming an unindexed second task system.

## Mutation authority

`allowed_producers` answers who may originate an artifact type. `allowed_mutators` answers who may update the registered semantic artifact after creation. Agent/skill contracts narrow this further.

Authority is conjunctive: a role must be permitted by the artifact type, its local role/skill contract, current ticket/contract scope, and path ownership where applicable.

## Domain packs

A consuming repository should extend path ownership for real product directories and may add specialist artifact types/contracts. It should not silently change generic artifact IDs such as `PLAN_DELTA`, `QA_REPORT`, or `DELIVERY_TICKET`; a semantic change should be versioned or explicitly migrated.

## Validation

`scripts/validate_agent_assets.py` checks that:

- router/catalog/ownership point to the artifact registry;
- every registered agent and skill has exactly one machine-readable artifact contract;
- every local role/skill file contains an `## Artifact contract` section pointing to `.agents/artifacts.json`;
- every produced/mutated artifact type exists;
- artifact owners/producers/mutators are registered;
- registered templates exist.

CI runs this validator, so incomplete artifact routing is a harness failure rather than a documentation nit.
