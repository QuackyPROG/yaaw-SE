# yaaw-SE v2 — design branch

This folder is the draft home for the next interpretation of yaaw-SE.

`main` remains the current v1 control plane. The `yaaw-SEv2` branch is intentionally allowed to be incomplete while the workflow is re-designed one public workflow at a time.

## Why this exists

The current harness has strong controller, ticket, authority, context, recovery, and evaluation machinery, but the method itself is spread across agents, skills, rules, JSON policy, scripts, and documentation.

v2 is exploring a simpler external model inspired by the useful part of BMAD's skill-driven organization:

- a small set of obvious workflow skills;
- `_yaaw-SE/` as the shared method/knowledge source;
- thin skill entrypoints that load only what the active workflow needs;
- durable artifacts/checkpoints instead of depending on conversation memory;
- the existing deterministic controller remains the enforcement layer rather than being replaced by prompts.

## Current public-workflow hypothesis — NOT LOCKED

The working list is:

1. `yaaw-orchestrator`
2. `yaaw-prd`
3. `yaaw-planner`
4. `yaaw-ticket`
5. `yaaw-implement`
6. `yaaw-verify` or `yaaw-review` — unresolved
7. `yaaw-release` — exact workflow and whether a dedicated Release Engineer remains are unresolved

Only `yaaw-prd` is being designed in this slice. Do not treat the rest as final architecture.

## PRD decisions locked for this draft

`yaaw-prd` is not a one-shot Markdown generator. It is the stakeholder-facing product-definition workflow.

It may begin from:

- a vague idea;
- rough notes;
- a draft PRD;
- an existing PRD that needs clarification;
- an explicit stakeholder-requested product change.

The PRD workflow owns product discovery, not technical planning. It must ask questions a non-technical stakeholder can answer. Technical choices belong downstream unless they create a product consequence that needs stakeholder authority.

The core loop is:

```text
READ CURRENT PRD / SOURCE INTENT
          ↓
DISCOVER THE MOST MATERIAL GAPS
          ↓
ASK UP TO 5 SHORT QUESTIONS
          ↓
STAKEHOLDER ANSWERS
          ↓
RECORD ACCEPTED DECISIONS
          ↓
EDIT ONLY THE AFFECTED PRD PARTS
          ↓
READ THE UPDATED PRD FROM THE BEGINNING
          ↓
REDISCOVER USING THE NEW PRODUCT STATE
          ↓
        repeat
```

A round is regenerated from the *current* PRD. It is not question 6–10 from a static list produced at the beginning.

### Question UX

Each question is one direct stakeholder decision with quick choices:

```text
1. Who can join a workspace?
A. Invite only
B. Anyone with a link
C. Request approval
Recommended: A
```

The user may answer `1A 2C 3B`, write normal sentences, reject every option, mix choice letters with explanation, or provide a completely different behavior. The choices accelerate discovery; they do not restrict stakeholder authority.

Ask at most five questions per round. If only two material unknowns remain, ask two. Never invent filler questions to reach five.

### Mandatory rediscovery lenses

After every accepted answer/edit, rediscover against the complete updated PRD for:

- core behavior and user flows;
- scope and non-goals;
- feature dependencies;
- create/change/disable/delete lifecycle behavior;
- roles, ownership, and permissions;
- failure behavior and recovery;
- contradictions and discrepancies;
- material edge cases;
- feature addition/change/removal impact;
- security, abuse, privacy, destructive actions, and unsafe defaults;
- useful product opportunities that may be suggested but never silently added.

Security/privacy/destructive behavior outrank convenience questions.

### Feature changes and removals

A requested removal is not a text deletion.

Before applying a material feature removal or behavior change, inspect what depends on it. Example: if invitations are removed, rediscover how members join, what happens to pending invitations, and whether billing/access flows depended on invitation state.

If downstream behavior becomes undefined, ask the stakeholder in plain product language before finalizing the change.

### Product suggestions

The workflow may discover a useful missing feature or safer behavior. It may present that as a stakeholder decision with a concise recommendation. It may not silently promote the suggestion into scope.

### Durable memory

Important stakeholder decisions, accepted changes, rejected/deferred suggestions, and discovery outcomes are checkpointed in an append-only decision log. This is decision-of-record memory, not hidden chain-of-thought.

The visible PRD remains clean and current. The log exists so the workflow can resume after compaction, thread retirement, or a fresh agent without reconstructing the conversation.

### Stop condition

Do not attempt to enumerate every hypothetical edge case in existence.

PRD discovery is ready to stop when no **material unresolved product decision** remains that would meaningfully change:

- product scope;
- user-visible behavior;
- ownership/permissions;
- lifecycle/recovery;
- security/privacy/destructive behavior;
- feature dependencies;
- or the downstream engineering direction.

Non-blocking ideas may remain explicitly deferred.

## PRD / SPEC / Ticket — working hypothesis only

This is deliberately **not finalized yet**:

```text
PRD    ≈ stakeholder/product truth
SPEC   ≈ engineering interpretation of that truth
TICKET ≈ bounded executable work
```

We still need to challenge:

- whether Planner always creates a SPEC or only for material work;
- whether a SPEC can replace some Ticket usage or whether every material execution still needs a Ticket contract;
- whether planning state needs a separate PLAN artifact or only SPEC + checkpoints + ticket frontier;
- which decisions Planner owns versus which must route back through `yaaw-prd`;
- how Planner handles bugs, security findings, architecture changes, and newly discovered opportunities;
- whether verification is best exposed as `yaaw-verify`, `yaaw-review`, or a different split;
- whether Release Engineer remains a role or release becomes a policy-gated workflow executed by the orchestrator;
- how much of v1's existing agent roster survives v2.

Do not resolve these by implication while implementing PRD.

## Codex policy for this branch

Project-local Codex defaults on `yaaw-SEv2` are intentionally quality-biased for the design work:

- root/default: `gpt-5.6-luna` with `max` reasoning;
- spawned subagents: `gpt-5.6-luna` with `xhigh` reasoning.

Runtime observation is still authoritative: a config value is a requested default, not proof that a particular Codex build/account actually honored the model/effort at execution time.
