# Context loading

Load the smallest authoritative context needed for the current judgment.

## Progressive-disclosure invariant
Workflow selection is metadata-first.

A router may load its role contract, router workflow, workflow/execution registries, state/artifact metadata, and the minimum evidence needed to select one route. It must not preload sibling or downstream workflow bodies, their templates, or their expertise merely because they might be needed later.

After exactly one workflow is selected:
1. resolve that workflow through `registries/workflows.json`;
2. load its body;
3. load only its declared/current artifact references and applicable rules;
4. load selected expertise only after relevance is established;
5. load a template only when the selected workflow is actually going to create that artifact.

After durable output, return to routing before opening another workflow contract.

## Normal semantic context
```text
role contract
+ selected workflow contract
+ active artifact and revision
+ directly referenced decisions/research
+ relevant product constraints
+ relevant project rules
+ relevant repository files/diff
+ selected expertise
+ prior review finding when repairing
+ current handoff/repository capability when dispatched
```

Do not automatically load every PRD revision, research artifact, ticket, review, expertise module, template, or the full repository.

## Canonical artifact discovery
Exact YAAW reads come from the handoff/registries. Roles do not grep for alternate YAAW artifact locations. Repository/application exploration is allowed only when the selected workflow admits it.

## Handoff freshness
A handoff names exact artifact paths/revisions, read/write sets, selected expertise, repository requirement, observed repository basis, and transition sequence. Before executing it, verify those bases still match current reality. If they do not, discard the stale handoff and re-enter orchestration inspection.

Runtime handoffs, intent, and observed-state snapshots live under `.yaaw-core/runtime/`; they are coordination caches, not semantic sources of truth.
