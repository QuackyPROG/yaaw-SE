# Role I/O and communication contract

YAAW roles communicate through durable artifacts, exact Orchestrator handoffs, and typed results. Roles do not privately command peer roles.

## Machine truth
- `registries/artifacts.json` defines canonical artifact classes, locations, durability, and semantic ownership.
- `registries/role-io.json` defines each role's default read/write authority.
- `registries/workflows.json` maps canonical workflow IDs to one role/workflow contract.
- `registries/execution-policy.json` defines repository requirements and context/research admission for every workflow.
- `.yaaw-core/runtime/handoff.json` resolves those contracts to one exact dispatch.
- `.yaaw-core/runtime/intent.json` may preserve the public entrypoint's desired destination while prerequisites are resolved.

## Dispatch contract
Every semantic-role handoff records exact reads, writes, forbidden writes, current revisions, selected expertise, repository requirement/basis, desired intent, expected durable output, and allowed result vocabulary.

The role reads the handoff, then its role contract, resolves `handoff.workflow` through the workflow registry, and only then loads the selected workflow and exact admitted context.

A role must not search the repository for alternate YAAW artifact locations when a canonical input is missing. Missing or stale canonical prerequisites produce a typed result to Orchestrator.

## Communication topology
```text
PRD / Planner / Implementer / Reviewer
        ↓ durable output + typed result
     Orchestrator
        ↓ exactly one next dispatch
```

Roles never spawn or command peer roles. **Roles report reality; Orchestrator decides routing.**

## Typed results
Common results include `SUCCESS`, `READY`, `HUMAN_INPUT_REQUIRED`, `PRECONDITION_UNSATISFIED`, `REVIEW_REQUIRED`, `REPLAN_REQUIRED`, `BLOCKED`, `PASS`, `REPAIR`, `REPLAN`, and `COMPLETE`.

`PRECONDITION_UNSATISFIED` includes a reason such as `NO_PRODUCT`, `PLANNING_UNREADY`, `SPEC_MISSING`, `NO_READY_TICKET`, `STALE_SOURCE`, or `REPOSITORY_IDENTITY_UNAVAILABLE`.

A missing ticket never authorizes Implementer to create one. Implementer returns `PRECONDITION_UNSATISFIED:NO_READY_TICKET`; Orchestrator routes Planner.

## Authority invariant
Filesystem access never grants semantic authority. A role may detect an invalid upstream contract but returns control to its owner instead of rewriting it.
