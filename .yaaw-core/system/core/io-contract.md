# Role I/O and communication contract

YAAW roles communicate through durable artifacts, exact Orchestrator handoffs, and typed results. Roles do not privately command peer roles.

## Machine truth
- `.yaaw-core/system/registries/artifacts.json` defines canonical artifact classes, locations, durability, and semantic ownership.
- `.yaaw-core/system/registries/role-io.json` defines each role's default read/write authority.
- `.yaaw-core/system/registries/workflows.json` maps canonical workflow IDs to one role/workflow contract.
- `.yaaw-core/system/registries/execution-policy.json` defines repository requirements, execution-context policy, and context/research admission for every workflow.
- `.yaaw-core/runtime/handoff.json` resolves those contracts to one exact dispatch.
- `.yaaw-core/runtime/intent.json` may preserve the public entrypoint's desired destination while prerequisites are resolved.

## Dispatch contract
Every semantic-role handoff records exact reads, writes, forbidden writes, current revisions, selected expertise, repository requirement/basis, desired intent, expected durable output, and allowed result vocabulary.

The role reads the handoff, then its role contract, resolves `handoff.workflow` through the workflow registry, and only then loads the selected workflow and exact admitted context.

A role must not search the repository for alternate YAAW artifact locations when a canonical input is missing. Missing or stale canonical prerequisites produce a typed result to Orchestrator.

Host execution transport is separate from semantic communication. A semantic role may run in another fresh host context, but authority still flows only through durable YAAW artifacts and typed results.

## Communication topology
```text
PRD / Planner / Implementer / Reviewer
        ↓ durable output + typed result
     Orchestrator
        ↓ inspect reality
        ↓ exactly one next dispatch
```

Roles never spawn or command peer roles. **Roles report reality; Orchestrator decides routing.**

A worker's textual success message is not semantic truth. Orchestrator verifies the expected artifact, revision, repository/evidence basis, and legal state transition after every dispatched execution.

## Typed results
Common results include `SUCCESS`, `READY`, `HUMAN_INPUT_REQUIRED`, `PRECONDITION_UNSATISFIED`, `REVIEW_REQUIRED`, `REPLAN_REQUIRED`, `BLOCKED`, `PASS`, `REPAIR`, `REPLAN`, and `COMPLETE`.

Framework-level stop results are `FRAMEWORK_INTEGRITY_VIOLATION`, `FRAMEWORK_INTEGRITY_UNKNOWN`, and `FRAMEWORK_CONTRACT_INCONSISTENCY`. They are installation/runtime trust failures, not ticket lifecycle states, and must not be represented by fabricating a ticket transition.

Host-execution stop results are `HOST_ISOLATION_UNAVAILABLE`, `HOST_EXECUTION_PROFILE_UNAVAILABLE`, and `AUTHORITY_EXECUTION_FAILED`. They describe execution transport/capability failures, not semantic workflow outcomes or ticket lifecycle states.

- `HOST_ISOLATION_UNAVAILABLE`: strict isolation was required, but the host could not create an isolated worker.
- `HOST_EXECUTION_PROFILE_UNAVAILABLE`: an execution mechanism existed, but the host could not guarantee the configured effective authority model/reasoning profile.
- `AUTHORITY_EXECUTION_FAILED`: the correct authority execution actually started and failed under the bounded retry/fallback policy.

A host isolation/profile stop raised before child creation is a pre-execution host failure and must not be counted as an authority execution failure.

`PRECONDITION_UNSATISFIED` includes a reason such as `NO_PRODUCT`, `PLANNING_UNREADY`, `SPEC_MISSING`, `NO_READY_TICKET`, `STALE_SOURCE`, or `REPOSITORY_IDENTITY_UNAVAILABLE`.

A missing ticket never authorizes Implementer to create one. Implementer returns `PRECONDITION_UNSATISFIED:NO_READY_TICKET`; Orchestrator routes Planner.

## Framework write invariant
No semantic-role handoff may admit `.yaaw-core/system/**` as a write surface. If a role discovers a contradiction in the package-managed framework, it returns a typed framework failure to Orchestrator. Installer repair is the only supported package mutation path.

## Authority invariant
Filesystem access never grants semantic authority. A role may detect an invalid upstream contract but returns control to its owner instead of rewriting it.
