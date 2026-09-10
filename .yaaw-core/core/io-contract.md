# Role I/O and communication contract

YAAW roles communicate through durable artifacts, exact Orchestrator handoffs, and typed results. They do not privately delegate work to peer roles.

## Machine truth

- `registries/artifacts.json` defines canonical artifact path patterns and semantic/lifecycle ownership.
- `registries/role-io.json` defines each role's default read/write authority.
- `registries/workflows.json` maps every canonical workflow ID to exactly one workflow contract.
- `registries/context-policy.json` defines each role's optional learned-memory phase and target context budget.
- `.yaaw/runtime/handoff.json` resolves those symbolic contracts to the exact files and context policy for one dispatch.
- `.yaaw/runtime/intent.json` records the public skill's desired destination while prerequisites are being resolved.

## Dispatch rule

Every semantic-role dispatch must include:

- exact `reads`;
- exact `writes` or ticket-admitted application paths;
- `forbidden_writes`;
- current artifact revisions;
- repository identity;
- desired intent;
- selected `context_policy` copied from the machine registry;
- allowed/expected result vocabulary.

A semantic role must read `.yaaw/runtime/handoff.json` before semantic work, then read its role contract, resolve `handoff.workflow` through `registries/workflows.json`, and read that exact workflow contract. Only then may it load the handoff `reads`, selected expertise, and admitted repository/evidence context.

If a YAAW workflow artifact is not named by the canonical workflow registry/handoff chain, the role does not search the repository hoping to discover an alternate workflow or artifact. The only allowed exploratory search is repository/application inspection that the current ticket or planning workflow explicitly admits.

## Workflow input closure

Every file under `.yaaw-core/workflows/**/*.md` must be registered exactly once in `registries/workflows.json` and declare both `## Purpose` and `## Inputs`.

For a semantic-role workflow, every required canonical YAAW artifact named by `## Inputs` must be available through the current handoff `reads` or be same-dispatch derived data produced by an already-entered internal subworkflow. An internal same-role subworkflow inherits the exact current handoff, role, revisions, repository basis, `writes`, `forbidden_writes`, and context policy; calling it never broadens authority.

If a required canonical input is missing, stale, or outside the handoff, return `PRECONDITION_UNSATISFIED` (or the workflow's narrower documented stop result) to Orchestrator. Never compensate by scanning for an alternate YAAW artifact location.

Optional learned-memory retrieval is not workflow-artifact discovery and does not expand `reads`, `writes`, or authority. It may be used only at the phase allowed by `context_policy` and `core/project-memory.md`. Missing memory is never a missing YAAW prerequisite.

## Learned-memory side effects

When `core/project-memory.md` explicitly allows it, a role may perform a best-effort provider correction or initiative update. These are auxiliary external-memory side effects, not canonical YAAW writes.

They:

- do not modify the handoff's YAAW file write set;
- do not satisfy required durable output;
- cannot justify a lifecycle transition or review result;
- are non-blocking if the provider is unavailable or fails;
- must preserve the role's semantic authority boundary.

Hindsight-specific behavior is defined only in `integrations/hindsight.md`; do not copy provider logic into public skills.

## Communication topology

Roles never spawn or command peer roles.

- PRD does product work and returns a result to Orchestrator.
- Planner does engineering/spec/ticket work and returns a result to Orchestrator.
- Implementer does admitted code/test/evidence work and returns a result to Orchestrator.
- Reviewer records independent acceptance and returns a classification to Orchestrator.
- Orchestrator alone chooses and dispatches the next role/workflow.

Core rule: **Roles report reality. Orchestrator decides routing.**

## Lifecycle writing

Semantic roles may author the evidence/judgment that justifies a lifecycle outcome, but they do not mutate `.yaaw/state.json` or runtime routing state. `registries/transitions.json` records semantic outcome authority in `owner` and the actual lifecycle state writer in `state_writer`; `state_writer` is Orchestrator for ticket transitions.

A workflow may therefore say that Implementer or Reviewer *reports* `REPLAN_REQUIRED`, or that Reviewer *classifies* `PASS`, without granting that role permission to persist ticket lifecycle state. Orchestrator validates the durable result against `registries/transitions.json` and writes the legal transition.

Ticket semantic content remains Planner-owned. Orchestrator may change ticket lifecycle metadata only; it may not rewrite ticket goal, scope, acceptance criteria, architecture, dependencies, or non-goals.

Learned memory is never transition evidence.

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

`PRECONDITION_UNSATISFIED` must include a concrete reason such as `NO_READY_TICKET`, `SOURCE_SPEC_MISSING`, or `STALE_SOURCE_REVISION`. Reason codes do not replace the typed result. Orchestrator then resolves the missing prerequisite through the routing policy.
