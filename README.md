# YAAW-SE v2

YAAW-SE is my take on an autonomous software-engineering workflow that doesn’t depend on keeping one giant agent alive forever.

The basic idea is pretty simple:

> **Agents are disposable. Artifacts are durable.**

A PRD session can end. A planning session can end. An implementation or review session can end too. As long as the important decisions, state, and evidence were written down, a fresh context should be able to pick the work back up without needing the old conversation.

That’s what YAAW is built around.

## How it works

The stuff you actually invoke lives in `skills/`. Those skills are intentionally small — they’re basically entry points into the real workflows inside `.yaaw-core/`.

When YAAW is used inside a project, its project-specific memory lives in `.yaaw/`.

So the rough shape is:

```text
skills/        -> things you call
.yaaw-core/    -> how YAAW actually works
.yaaw/         -> what YAAW knows about the current project
```

There are no persistent named agents hiding behind the system. Instead, every run gets a role, a workflow, and whatever expertise is relevant to the job.

The five main roles are:

- **PRD** — figures out what the product is supposed to do.
- **Planner** — turns that into engineering decisions, specs, and tickets.
- **Implementer** — works on one admitted ticket at a time.
- **Reviewer** — independently checks whether the implementation actually passes.
- **Orchestrator** — looks at the current project state and decides what should happen next.

The Orchestrator handles continuity, not product or engineering judgment. It routes the work, but the role responsible for that work still owns the decision.

## The skills

Most of the time, these are the ones you’ll care about:

- `@yaaw-orchestrator` — look at the project as it exists right now and continue from the correct next step.
- `@yaaw-prd` — create, continue, refine, or revise the product definition.
- `@yaaw-planner` — continue engineering discovery, decisions, readiness, specs, or ticket planning.
- `@yaaw-implement` — implement one ready ticket.
- `@yaaw-review` — independently review the current implementation.

There are also direct shortcuts when you already know exactly what you want to run:

- `@yaaw-revise-prd`
- `@yaaw-refine-prd`
- `@yaaw-planning-review`
- `@yaaw-create-spec`
- `@yaaw-create-ticket`
- `@yaaw-create-tickets`
- `@yaaw-repair`

The important part is that these shortcuts still use the same canonical workflows. They don’t have their own separate logic.

## What gets remembered

A project using YAAW gets a `.yaaw/` directory that looks roughly like this:

```text
.yaaw/
├── product.md
├── engineering.md
├── state.json
├── specs/
├── tickets/
├── reviews/
├── evidence/
├── rules/
└── runtime/
    ├── observed-state.json
    └── handoff.json
```

`product.md` keeps the product intent. `engineering.md` keeps the engineering understanding and decisions. Specs and tickets define the actual work. Reviews and evidence record what was verified and accepted.

`state.json` is useful, but it isn’t treated like unquestionable truth. If state says one thing and the repository clearly says another, YAAW is supposed to reconcile that instead of blindly trusting the state file.

The files under `.yaaw/runtime/` are even less precious. They’re coordination caches and can be rebuilt when needed.

## Starting YAAW in a project

From a YAAW checkout, run:

```text
python scripts/init_project.py /path/to/project
```

That creates the initial `.yaaw/` structure and starting artifacts.

You can run it again safely. It won’t overwrite project memory that already exists.

After that, the normal flow is basically:

```text
PRD
  -> planning
  -> readiness
  -> spec
  -> tickets
  -> implementation
  -> review
  -> repair or replan when needed
  -> next piece of work
  -> complete
```

You don’t have to manually walk that whole chain every time. That’s what `@yaaw-orchestrator` is for — it inspects what already exists and continues from the right place.

## Why the workflow is strict about artifacts

YAAW assumes contexts will disappear.

That means an accepted product decision shouldn’t live only in chat. An engineering decision shouldn’t disappear with the Planner context. An implementation shouldn’t count as accepted just because the Implementer says it worked.

The workflow tries to leave enough durable evidence behind that another fresh context can answer:

- What are we building?
- What engineering decisions have already been made?
- What is the current implementation slice?
- What has actually been implemented?
- What was verified?
- Has an independent reviewer accepted it?
- What should happen next?

If a fresh context can’t answer those from the project artifacts and repository, something important probably wasn’t written down.

## Repair vs. replan

One distinction YAAW cares about a lot:

**REPAIR** means the plan is still valid, but the implementation has a defect.

**REPLAN** means the underlying engineering contract is wrong, incomplete, or invalidated by new evidence.

So a normal bug goes back to implementation on the same ticket. An architecture or contract problem goes back to planning instead of asking the Implementer to invent a new design on the fly.

## Recovery is part of the normal workflow

The system is also designed around the fact that work can get interrupted.

For example, if a ticket still says `IN_PROGRESS`, but the code already exists and verification evidence was written, YAAW should not blindly implement the ticket again. It should reconcile what actually happened and continue toward review.

The same idea applies to stale reviews, changed product decisions, changed specs, or old PASS results that are no longer valid for the current repository state.

Repository reality and durable evidence matter more than pretending the last state write was perfect.

## Behavioral checks

The repo includes deterministic test infrastructure for checking the lifecycle without turning the test harness into another runtime orchestrator.

A few useful pieces:

- `.yaaw-core/registries/routing-policy.json` — routing precedence used by the conformance tests.
- `.yaaw-core/registries/transitions.json` — legal ticket-state transitions.
- `tests/fixtures/lifecycle_cases.json` — lifecycle and recovery scenarios.
- `tests/fixtures/fresh_context_project/` — a complete artifact graph used to prove that fresh contexts can reconstruct the work.
- `scripts/behavior_oracle.py` — deterministic validation only; it is not runtime authority.

To run the checks:

```text
python scripts/validate_core.py
python scripts/validate_behavior.py
python scripts/behavior_oracle.py
python -m unittest discover -s tests -v
```

If you want the more formal version of how lifecycle transitions, invalidation, recovery, and authority work, check `.yaaw-core/README.md` and the contracts under `.yaaw-core/core/`.
