# Context loading

Load the smallest authoritative context needed for the current judgment.

## Progressive-disclosure invariant
Workflow selection is metadata-first. A router may load its role contract, router workflow, registries, state/artifact metadata, and minimum evidence required to select one route. It **must not preload sibling or downstream workflow bodies**, templates, or expertise merely because they might be needed later.

After exactly one workflow is selected:
1. resolve that workflow through `.yaaw-core/system/registries/workflows.json`;
2. load its body;
3. load only declared/current artifact references and applicable rules;
4. load selected expertise only after relevance is established;
5. load a template only when the selected workflow will create that artifact.

After durable output, return to routing before opening another workflow contract.

## Fresh worker bootstrap
When an Orchestrator dispatch runs in a fresh host worker, the worker should receive only enough parent context to locate and execute the handoff:
- resolved workspace root;
- target semantic role;
- `.yaaw-core/runtime/handoff.json`;
- instruction to load the canonical role contract and resolve the workflow through registries;
- instruction to load only handoff-admitted artifacts/expertise/repository context;
- instruction not to route another YAAW authority role.

Do not copy the parent planning conversation, all project documents, all expertise, all workflows, review history, or a repository dump into a worker prompt. Those are either durable artifacts or discoverable only when admitted by the selected workflow.

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
Exact YAAW reads come from handoff/registries. Roles do not grep for alternate YAAW artifact locations.

## Handoff freshness
A handoff binds exact artifact revisions, read/write sets, selected expertise, repository requirement, canonical repository identity, transition sequence, installed YAAW version, installation/project-state schema versions, and manifest digest.

If any bound framework or repository basis changed after handoff creation, discard the handoff and inspect again. Runtime handoffs, intent, and observed-state snapshots are coordination caches, not semantic sources of truth.
