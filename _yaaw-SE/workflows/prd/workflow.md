# yaaw-prd workflow

Status: **v2 draft — PRD workflow only**

This workflow turns vague, partial, or existing product intent into a clear stakeholder-owned PRD through repeated discovery rounds.

It does **not** perform technical planning, choose architecture, create implementation tickets, or silently change accepted product intent.

## Entry behavior

`yaaw-prd` accepts five practical entry intentions without exposing five separate public skills:

- **CREATE** — no useful PRD exists yet; start from an idea, notes, or a rough draft.
- **CONTINUE** — resume an unfinished discovery session from the current PRD and decision log.
- **REFINE** — product intent is mostly correct, but the current PRD is vague, incomplete, contradictory, or weak.
- **REVISE** — the stakeholder explicitly wants product behavior/scope changed.
- **REVIEW** — inspect completeness and material holes without changing product intent unless the user chooses to continue discovery.

If the user says only `yaaw-prd`, show a compact state/action view instead of immediately interrogating them.

If the user says `edit the PRD`, infer REFINE versus REVISE from the requested change when possible. Ask only when the distinction materially changes authority or behavior.

## Inputs

Use the smallest useful set of:

1. explicit stakeholder direction from the current invocation;
2. existing PRD, if one exists;
3. PRD decision log, if one exists;
4. directly relevant product artifacts already declared as product truth.

Do not pull implementation details into the PRD merely because they exist in the repository.

## Product authority

The stakeholder/human remains the semantic authority for product intent.

The workflow may:

- identify ambiguity;
- identify contradictions;
- surface missing behavior;
- surface edge cases;
- identify security/privacy/destructive product consequences;
- explain consequences in plain language;
- offer concise choices;
- recommend a choice;
- suggest useful missing product capabilities.

The workflow may **not**:

- silently choose product behavior because it is technically convenient;
- silently add a suggested feature;
- silently remove or weaken an existing feature;
- turn technical architecture preference into product truth;
- rewrite accepted product semantics without explicit stakeholder direction.

## Core algorithm

Repeat the following until the readiness gate passes.

### 1. READ

Read the complete current PRD/source intent and accepted decision log.

Build a concise working product model from what is explicitly true **now**.

Do not treat superseded answers as current truth.

### 2. DISCOVER

Challenge the current product model through all relevant lenses:

#### Core behavior

- Who is the product/feature for?
- What can each actor actually do?
- What is the main successful flow?
- What happens before and after the main action?

#### Scope

- What is clearly in scope?
- What is clearly out?
- Is a requirement accidentally implying a much larger feature?
- Are optional/future capabilities being confused with v1 behavior?

#### Dependencies

- Does feature A require feature B to make sense?
- If a behavior changes, does another flow become undefined?
- If something is removed, what depended on it?

#### Lifecycle

For important entities/actions, consider:

- create;
- view/use;
- change;
- disable/suspend;
- transfer;
- expire;
- delete;
- restore/recover.

Only turn lifecycle observations into stakeholder questions when product behavior is genuinely undefined.

#### Roles, ownership, and permissions

- Who owns an entity?
- Who can invite/add/remove/change others?
- What can admins do that ordinary users cannot?
- What happens when an owner leaves?
- Are privilege boundaries understandable from the PRD?

#### Failure and recovery

- What does the user experience when a major operation fails?
- Can destructive mistakes be undone where product policy requires it?
- What should happen to partially completed or expired actions?

#### Contradictions/discrepancies

Look for statements that cannot both be true, including indirect contradictions across separate sections.

#### Edge cases

Prioritize edge cases that materially change product behavior, security, money, ownership, data loss, privacy, or downstream engineering direction.

Do not ask about obscure hypothetical cases only to appear exhaustive.

#### Security, abuse, privacy, and destructive behavior

Treat these as first-class product discovery concerns, not a final checklist.

Examples of stakeholder-facing consequences include:

- whether password reset signs out other devices;
- whether repeated failed verification attempts are limited;
- whether the product reveals that an email/account exists;
- who may export/delete sensitive data;
- whether deletions are recoverable;
- whether one person's action can expose another person's private content;
- whether invitations/links/codes can be reused;
- whether high-impact actions require confirmation or another owner.

Do not ask implementation questions such as encryption algorithm, database index, token representation, transaction primitive, or framework choice. Those belong downstream.

#### Product opportunities

A missing capability may be suggested when it clearly improves coherence, safety, or the core experience.

A suggestion is **not scope** until the stakeholder accepts it.

### 3. PRIORITIZE

Rank discovered unknowns by materiality.

Default priority order:

1. security/privacy/destructive behavior and abuse risk;
2. core product behavior;
3. contradictions/discrepancies;
4. feature dependencies and removal/change impact;
5. roles/ownership/permissions;
6. lifecycle/recovery;
7. material edge cases;
8. scope ambiguity;
9. useful product opportunities;
10. minor convenience/details.

Choose at most five stakeholder decisions for the next round.

Prefer questions whose answers collapse several downstream unknowns.

Never invent filler questions to reach five.

### 4. ASK

Each question must be compact and understandable without software-engineering knowledge.

Required shape:

```text
1. <one-line stakeholder question>
A. <short choice>
B. <short choice>
C. <short choice when useful>
Recommended: <choice> — <optional very short reason>
```

Rules:

- The question itself should normally fit on one line.
- Choices should be quick to scan.
- Two choices are valid when the decision is genuinely binary.
- Three is the normal maximum; add more only when the decision cannot be represented honestly otherwise.
- Recommendations are concise.
- Recommendations must not pretend the user already chose them.
- Prefer a safer/recoverable recommendation when the difference materially affects security, privacy, destructive behavior, or data loss.
- The user may answer with letters, prose, mixed answers, reject all choices, or invent another option.

Do not require syntax such as `1A`.

### 5. INTERPRET ANSWERS

For each answer:

- identify the actual stakeholder decision, not merely the selected letter;
- preserve free-form nuance;
- distinguish accepted behavior from suggestion/defer/rejection;
- detect when one answer changes the meaning of another answer from the same round;
- if the user's answer is internally contradictory, do not guess — carry the contradiction into rediscovery.

### 6. RECORD DECISIONS

Append decision-of-record entries before relying on them in later rounds.

Record only durable conclusions such as:

- accepted product behavior;
- explicit non-goal;
- rejected/deferred feature idea;
- superseding stakeholder direction;
- material unresolved question;
- discovery event such as `impact scan required` or `ready for planning`.

Do not record hidden reasoning or chain-of-thought.

### 7. APPLY MINIMAL PRD EDITS

Update only the PRD sections affected by the accepted answers and resulting necessary coherence edits.

Do not rewrite the entire PRD for style after every round.

Preserve already-settled intent unless the stakeholder changed it.

If the current PRD is accepted rather than draft, semantic changes require explicit stakeholder direction and the revision metadata/approval policy defined by the active artifact contract.

### 8. FULL RE-READ

After edits, read the complete updated PRD again from the beginning.

Do not rely on the pre-edit discovery list.

The updated PRD is now the subject of the next discovery pass.

### 9. CHANGE/REMOVAL IMPACT SCAN

Whenever a feature, role, permission, lifecycle rule, or core behavior is added, removed, disabled, or materially changed, explicitly inspect its dependents.

Examples:

- Removing invitations means rediscovering how new members join and what happens to pending invitations.
- Making workspace creation paid-only means rediscovering what happens to existing free workspace owners and what happens when a subscription expires.
- Removing an owner role means rediscovering who controls billing, member removal, destructive actions, and ownership transfer.
- Disabling account recovery means rediscovering how locked-out users regain access, if at all.

Do not finalize a removal while dependent product behavior is left accidentally undefined.

### 10. REDISCOVER

Run DISCOVER again using the new PRD and decision log.

The next round is selected from current truth, not from a static backlog of previously generated questions.

## Readiness gate

PRD discovery may stop when there is no material unresolved product decision likely to change:

- core scope;
- major user flows;
- roles/ownership/permissions;
- lifecycle/recovery;
- important feature dependencies;
- security/privacy/destructive behavior;
- meaningful failure behavior;
- or downstream engineering direction.

Before declaring readiness, perform a final complete pass over:

```text
CORE FLOWS
SCOPE / NON-GOALS
ROLES / PERMISSIONS
CREATE / CHANGE / DISABLE / DELETE
FAILURE / RECOVERY
FEATURE DEPENDENCIES
REMOVAL / CHANGE CONSEQUENCES
CONTRADICTIONS
MATERIAL EDGE CASES
SECURITY / ABUSE
PRIVACY / DATA EXPOSURE
DESTRUCTIVE ACTIONS
OPEN PRODUCT DECISIONS
```

If a material hole remains, run another discovery round.

If only non-blocking ideas remain, mark them deferred or open and finish.

## Output

At completion return only a concise stakeholder-facing summary:

- PRD path;
- current PRD status;
- number of product decisions recorded in this session;
- important deferred/non-blocking product questions, if any;
- `READY_FOR_PLANNING` when the readiness gate passes.

Do not dump internal discovery analysis.

## Downstream boundary

`READY_FOR_PLANNING` does not mean the implementation route is decided.

The downstream Planner is expected to read the PRD and repository evidence and determine technical architecture, engineering edge cases, dependencies, sequencing, and whatever engineering artifact(s) v2 ultimately standardizes.

If Planner later discovers a missing **product** decision, it should route that gap back through `yaaw-prd` in stakeholder language rather than asking the stakeholder technical questions.
