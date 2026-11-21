---
name: yaaw-probe
description: Probe the user relentlessly about a plan, feature or design until every decision is made. Use when the user wants a plan stress-tested, says "probe" or "grill", or /yaaw-se starts a feature.
---

# yaaw-probe

Interview the user until there is a shared understanding. Map the subject as a **design tree**: every decision branches into the decisions that hang off it.

## Rounds

Work the tree in **rounds**. The **frontier** is every decision whose prerequisites are already settled: the questions that can be asked now without guessing at answers not yet heard. Ask the whole frontier in one round, then wait for the answers.

Each answered round reshapes the tree. Recompute the frontier before every round. A question that depends on another question still open belongs to a later round.

## What earns a question

Ask only **load-bearing** questions: ones whose answer changes what gets built.

- **Facts are yours.** When a question needs a fact from the code, the docs or the web, look it up instead of asking. A lookup still running blocks only the questions downstream of it.
- **Decisions are the user's.** Scope, trade-offs, preferences and priorities go to the user, every time.
- **Cut scope here.** For every part of the feature, ask whether it needs to exist. Features, options and flexibility nobody asked for are named and cut now, as the build agents will not question scope later.
- **Defaults become assumptions.** When a decision has an obvious conventional answer, list it under "Assuming" instead of asking. The user can overturn any of them.

## UI features

`yaaw-designer` builds UI tickets and cannot ask about the look, so a feature with UI settles its design here. Read the project's `DESIGN.md`, tokens and existing screens first, and ask only what they do not answer:

- **Mode** of each new surface: Operate (a task), Read (understanding), Persuade (deciding and acting) or Experience (the work itself).
- **Look**: inherit the existing one, extend it, or create a new one. For a new look, the audience, where and how the screen is used, and the feel it should have.
- **Untouchable**: what must not change, such as copy, brand assets or existing flows.
- **Success**: what a good result looks like, and what would make a polished result feel wrong.
- **Assets**: images, fonts or icons the user will provide, and any new font or UI package (each one is a new dependency).

## Format

Number every question, give a recommended answer, and word each question so that "yes" accepts the recommendation.

```
❓ **Q1** - **<question title>**: <question body, with the options when there are several>

➡️ <recommended answer>

---

❓ **Q2** - ...

**Assuming:** <defaults, one line each>
```

## Done

The probe is done when the frontier is empty: every branch visited and nothing silently assumed. List the settled decisions in a few lines and act on them only after the user confirms.

When /yaaw-se started the probe, keep the settled decisions in `docs/yaaw-se/<slug>/DECISIONS.md`: one line per decision, grouped by topic, with the reason when it is not obvious. /yaaw-se says when to write it.
