# Role I/O and communication contract

YAAW roles communicate through durable artifacts, exact Orchestrator handoffs, and typed results. They do not privately delegate work to peer roles.

## Machine truth

- `registries/artifacts.json` defines canonical artifact path patterns and semantic/lifecycle ownership.
- `registries/role-io.json` defines each role's default read/write authority.
- `.yaaw/runtime/handoff.json` resolves those symbolic contracts to the exact files for one dispatch.
- `.yaaw/runtime/intent.json` records the public skill's desired destination while prerequisites are being resolved.

## Dispatch rule

Every semantic-role dispatch must include:

- exact `reads`;
- exact `writes` or ticket-admitted application paths;
- `forbidden_writes`;
- current artifact revisions;
- repository identity;
- desired intent;
- allowed/expected result vocabulary.

A role must read the handoff before doing semantic work. If a workflow artifact is not in the handoff, the role does not search the repository hoping to discover it. The only allowed exploratory search is repository/application inspection that the ticket or planning workflow explicitly admits.

## Communication topology

Roles never spawn or command peer roles.

- PRD does product work and returns a result to Orchestrator.
- Planner does engineering/spec/ticket work and returns a result to Orchestrator.
- Implementer does admitted code/test/evidence work and returns a result to Orchestrator.
- Reviewer records independent acceptance and returns a classification to Orchestrator.
- Orchestrator alone chooses and dispatches the next role/workflow.

Core rule: **Roles report reality. Orchestrator decides routing.**

## Lifecycle writing

Semantic roles may author the evidence that justifies a lifecycle change, but they do not mutate `.yaaw/state.json` or runtime routing state. `registries/transitions.json` records the semantic outcome authority in `owner` and the actual lifecycle state writer in `state_writer`; `state_writer` is Orchestrator for ticket transitions.

Ticket semantic content remains Planner-owned. Orchestrator may change ticket lifecycle metadata only; it may not rewrite ticket goal, scope, acceptance criteria, architecture, dependencies, or non-goals.

## Typed role results

Use explicit results instead of peer delegation prose. Common results include:

```text
SUCCESS
HUMAN_INPUT_REQUIRED
PRECONDITION_UNSATISFIED
REVIEW_REQUIRED
REPLAN_REQUIRED
BLOCKED
PASS
REPAIR
REPLAN
COMPLETE
```

`PRECONDITION_UNSATISFIED` must include a concrete reason such as `NO_READY_TICKET`, `SOURCE_SPEC_MISSING`, or `STALE_SOURCE_REVISION`. Orchestrator then resolves the missing prerequisite through the routing policy.
