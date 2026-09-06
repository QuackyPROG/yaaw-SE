# YAAW Workflow

This is the plain-English version of how YAAW is supposed to flow from an idea all the way to finished, reviewed work.

The short version is:

```text
PRD
  ↓
product.md
  ↓
Planner
  ↓
engineering.md
  ↓
Spec
  ↓
Tickets
  ↓
Implement
  ↓
Review
  ↓
PASS / REPAIR / REPLAN
  ↓
Orchestrator keeps the loop moving
```

The important part is that each stage leaves behind something durable. A session can end and a fresh context should still be able to continue from the artifacts in `.yaaw/`.

> **Agents are disposable. Artifacts are durable.**

---

## 1. PRD: figure out what we are actually building

The PRD role owns the product side of the problem.

Its main question is:

> What are we building, for whom, and what should it do?

It writes that into:

```text
.yaaw/product.md
```

`product.md` should stay mostly non-technical. It is where we keep things like:

- the goal
- target users
- user problems
- expected behavior
- important flows
- constraints
- scope
- non-goals
- accepted product decisions
- unresolved product questions

For example:

```text
Goal:
Users can create reusable API keys from the settings page.

Expected behavior:
- users can create a key
- the key is only shown once
- users can revoke a key
- revoked keys stop working immediately

Non-goals:
- team-shared keys
- key expiration
- usage analytics
```

At this point, we do **not** need to know the database schema, endpoint shape, React component structure, encryption details, or test strategy.

That comes next.

---

## 2. Planner: turn product intent into an engineering plan

Once `product.md` is ready, the Planner takes over.

Its question is:

> Given this product requirement and this actual codebase, how should we build it?

The Planner should not jump straight into writing a spec.

First, it inspects reality.

### Planner discovery

The Planner reads:

```text
.yaaw/product.md
existing repository structure
current architecture
project conventions
project rules
.yaaw/engineering.md if it already exists
existing specs and tickets if relevant
```

It tries to understand things like:

- what framework is this project using?
- how is auth already handled?
- where does the relevant data live?
- what testing setup already exists?
- what patterns does the repo already follow?
- what constraints do we need to respect?

That understanding gets written into:

```text
.yaaw/engineering.md
```

---

## 3. `engineering.md`: the Planner's durable engineering memory

A useful way to think about the two main artifacts is:

```text
product.md
= what the product needs to do

engineering.md
= how we currently understand the engineering problem
```

`engineering.md` keeps things like:

- product interpretation
- existing system understanding
- engineering constraints
- engineering decisions
- assumptions
- unresolved questions
- risks
- current decision frontier
- future fog
- architecture spine
- readiness status

Important decisions get durable IDs such as:

```text
ENG-001
ENG-002
ENG-003
```

Example:

```text
ENG-001

Decision:
API keys will be stored as SHA-256 hashes, not plaintext.

Reason:
The original key only needs to be shown once and should not be recoverable.

Rejected alternatives:
- plaintext storage
- reversible encryption

Implications:
- the generated key is only shown during creation
- authentication hashes incoming keys before lookup
```

That means another Planner, Implementer, or Reviewer can understand the decision later without needing the original conversation.

---

## 4. Planner: identify the current decision frontier

The Planner should not try to design the entire future of the product upfront.

It separates engineering knowledge into three buckets:

```text
Known decisions
Current decision frontier
Future fog
```

### Known decisions

Things that are already settled.

```text
ENG-001: hashed API key storage
ENG-002: keys belong to individual users
```

### Current decision frontier

Things that must be decided before the next implementation slice can safely happen.

Example:

```text
Do API keys inherit the user's permissions,
or do keys get their own permission scope?
```

That matters now, so it belongs in the current frontier.

### Future fog

Things we know may matter later, but do not block the current work.

Example:

```text
How will enterprise organizations eventually manage shared API keys?
```

That should not slow down the current slice.

The Planner only needs enough certainty to safely move the next piece of work forward.

---

## 5. Planner asks engineering questions only when they are actually needed

If the current frontier contains a material decision that really needs human input, the Planner asks.

For example:

```text
Should API keys inherit all permissions of the owning user?

A. Yes, always
B. No, keys get explicit scopes
C. Start with full permissions now, but keep the storage design open to scopes later

Recommendation: C

Reason:
It keeps the first version small without locking the architecture into a dead end.
```

The Planner should **not** ask the human to make routine reversible engineering choices it can safely own itself.

Bad examples:

```text
Should I make a new React component?
Should I use a helper function?
Should this be a unit test or integration test?
```

Those are normal engineering judgments.

---

## 6. Accepted engineering answers get written down immediately

The flow should be:

```text
ask
↓
human answers
↓
write the decision into engineering.md
↓
continue
```

Not:

```text
ask a lot of questions
have a long conversation
hope somebody summarizes it later
```

Once a decision is accepted, it should become durable before the workflow moves on.

That is what lets YAAW survive fresh contexts.

---

## 7. Planner performs a readiness review

Once the current frontier looks settled, the Planner asks:

> Could a completely fresh Implementer build the next slice without inventing a material product or architecture decision?

If the answer is no, planning keeps going.

Possible readiness outcomes include:

```text
MISSING_DECISIONS
PRODUCT_GAP
REPLAN
BLOCKED
```

If the answer is yes:

```text
PASS
```

Only after that should the Planner turn the current frontier into an implementation spec.

---

## 8. Planner creates a spec

The next artifact is something like:

```text
.yaaw/specs/SPEC-001.md
```

The spec is the bounded engineering contract for the next implementation slice.

It should cover things like:

- goal
- product source
- engineering decisions
- boundaries
- expected behavior
- data/state
- interfaces
- failure modes
- security
- UX/accessibility
- testing
- observability
- migration/compatibility
- non-goals
- risks
- acceptance conditions

The spec should reference existing engineering decisions instead of silently inventing new ones.

Example:

```text
Uses:
ENG-001
ENG-002
ENG-003
```

So the chain now looks like:

```text
product.md
    ↓
engineering.md
    ↓
SPEC-001
```

---

## 9. Planner splits the spec into tickets

Once the spec is ready, the Planner creates executable tickets:

```text
TASK-001
TASK-002
TASK-003
...
```

For example:

```text
SPEC-001 — API Keys

TASK-001
Add API key persistence model

TASK-002
Add key generation and revocation service
Depends on TASK-001

TASK-003
Add API endpoints
Depends on TASK-002

TASK-004
Add settings UI
Depends on TASK-003
```

Each ticket should be small enough for a fresh Implementer to execute without needing the whole project history.

A ticket should carry enough context to explain:

- its goal
- source spec
- product requirements
- engineering decision references
- relevant files/areas
- required behavior
- allowed scope
- non-goals
- acceptance criteria
- required tests
- dependencies
- expertise hints
- current status

At that point the Planner is done for that implementation slice.

```text
product.md
    │
    ▼
engineering.md
    │
    ▼
SPEC-001
    │
    ├── TASK-001
    ├── TASK-002
    ├── TASK-003
    └── TASK-004
```

---

## 10. Implementer takes exactly one `READY` ticket

The Implementer should work on one admitted ticket at a time.

Example:

```text
TASK-001 = READY
```

It only needs the relevant context:

```text
TASK-001
SPEC-001
ENG decisions referenced by TASK-001
relevant product constraints
relevant code
relevant rules
relevant expertise
```

Then the normal implementation flow is:

```text
READY
↓
IN_PROGRESS
↓
implementation
↓
verification
↓
evidence
↓
REVIEW_REQUIRED
```

The Implementer never marks its own work as `PASS`.

Implementation and acceptance are separate jobs.

---

## 11. Reviewer checks the actual work independently

The Reviewer starts from fresh context and checks the repository as it really exists.

It should inspect:

- the ticket
- the spec
- the relevant product requirements
- the referenced engineering decisions
- the actual code/diff
- tests
- verification evidence
- repository state

The Reviewer then returns exactly one of:

```text
PASS
REPAIR
REPLAN
BLOCKED
```

### PASS

The implementation satisfies the contract.

```text
TASK-001 → PASS
```

YAAW can move on to the next admitted ticket.

### REPAIR

The plan is still correct, but the implementation has a defect.

Example:

```text
The API works, but revocation does not invalidate the cache.
```

The same ticket goes back for repair:

```text
REPAIR_REQUIRED
↓
Implementer repairs it
↓
REVIEW_REQUIRED
↓
Reviewer checks it again
```

### REPLAN

The implementation exposed a problem with the engineering contract itself.

Example:

```text
The chosen database model cannot satisfy a requirement in the PRD.
```

That goes back to planning:

```text
TASK → REPLAN_REQUIRED
        ↓
Planner
        ↓
engineering.md updated
        ↓
spec revised
        ↓
tickets revised
```

The distinction is important:

```text
REPAIR = implementation wrong

REPLAN = plan wrong
```

### BLOCKED

The role cannot safely continue because required information, evidence, access, or approval is missing.

YAAW should stop and make the blocker explicit instead of guessing.

---

## 12. Orchestrator keeps the whole loop moving

Most of the time, the user should not need to manually call every step in sequence.

The normal entry point is:

```text
@yaaw-orchestrator
```

The Orchestrator looks at the durable artifacts, state, evidence, and actual repository, then chooses the one correct next workflow.

For example:

```text
product.md missing
→ PRD

product ready, engineering missing
→ Planner discovery

Planner has an unresolved current frontier
→ Planner questions

planning readiness PASS, no spec
→ create spec

spec exists, no executable tickets
→ create tickets

TASK-001 READY
→ Implement

TASK-001 REVIEW_REQUIRED
→ Review

TASK-001 REPAIR_REQUIRED
→ Repair

TASK-001 REPLAN_REQUIRED
→ Planner

TASK-001 PASS + TASK-002 READY
→ Implement TASK-002

all current tickets PASS but product scope remains
→ Planner finds the next frontier

all accepted product scope is covered by fresh acceptance evidence
→ COMPLETE
```

The Orchestrator owns continuity and routing.

It does **not** own product decisions, engineering architecture, implementation details, or acceptance judgment.

Those stay with the roles responsible for them.

---

## The full mental model

```text
                   ┌──────────────┐
                   │  product.md  │
                   └──────┬───────┘
                          │
                         PRD
                          │
                          ▼
                  product intent ready
                          │
                          ▼
                    ┌──────────┐
                    │ Planner  │
                    └────┬─────┘
                         │
              inspect actual repository
                         │
                         ▼
                 engineering.md
                         │
               resolve current frontier
                         │
                         ▼
                  readiness PASS
                         │
                         ▼
                     SPEC-001
                         │
                         ▼
              TASK-001 / TASK-002 / ...
                         │
                         ▼
                   Implementer
                         │
                         ▼
                 REVIEW_REQUIRED
                         │
                         ▼
                     Reviewer
                    /      |      \
                 PASS    REPAIR   REPLAN
                   │       │        │
                   │       │        └────→ Planner
                   │       └─────────────→ Implementer
                   │
                   ▼
                next ticket
                   │
                   ▼
             next frontier / COMPLETE
```

The Orchestrator sits around this entire loop and keeps asking one question:

> Given the durable artifacts and the actual repository state, what is the one correct next workflow?

That is the YAAW flow.