# Context loading

Load the smallest authoritative context needed for the current judgment.

## Progressive-disclosure invariant
Workflow selection is metadata-first. A router may load its role contract, router workflow, registries, state/artifact metadata, and minimum evidence required to select one route. It **must not preload sibling or downstream workflow bodies**, templates, or expertise merely because they might be needed later.

After exactly one workflow is selected:
1. resolve it through `registries/workflows.json`;
2. load its body;
3. load only declared/current artifact references and applicable rules;
4. load selected expertise only after relevance is established;
5. load a template only when the selected workflow will create that artifact.

After durable output, return to routing before opening another workflow contract.

## Canonical artifact discovery
Exact YAAW reads come from handoff/registries. Roles do not grep for alternate YAAW artifact locations.

## Handoff freshness
A handoff binds exact artifact revisions, read/write sets, selected expertise, repository requirement, canonical repository identity, transition sequence, installed YAAW version, installation/project-state schema versions, and manifest digest.

If any bound framework or repository basis changed after handoff creation, discard the handoff and inspect again. Runtime handoffs, intent, and observed-state snapshots are coordination caches, not semantic sources of truth.
