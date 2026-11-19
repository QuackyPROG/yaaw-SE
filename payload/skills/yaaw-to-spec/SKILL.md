---
name: yaaw-to-spec
description: Turn settled decisions into a feature spec without interviewing. Preloaded into yaaw-planner. Use when a feature's decisions are settled and its spec needs writing.
---

# yaaw-to-spec

Synthesise a spec from what is already settled: the feature's `DECISIONS.md`, the conversation and the codebase. Do not interview. A gap is listed under **Open questions** in the spec, never filled with a guess.

## Process

1. **Explore.** Read the code the feature touches. Use the domain language from `GLOSSARY.md` and respect the ADRs in `docs/adr/`.
2. **Find what to reuse.** List the existing modules, helpers, components and installed dependencies the feature can build on. This list feeds every ticket's **Reuse first** line.
3. **Sketch the seams.** Choose the seams the feature will be tested at. Prefer existing seams to new ones, and the highest seam possible. The fewer seams, the better, and the ideal number is one. A new seam needs a second adapter (see `yaaw-architecture`).
4. **Write** `docs/yaaw-se/<slug>/SPEC.md` with the template below.

The spec is done when every decision in `DECISIONS.md` appears in it, and every seam names what it catches.

## Template

```markdown
# <Feature name>

## Problem
The problem from the user's point of view.

## Solution
The solution from the user's point of view.

## User stories
1. As a <actor>, I want <feature>, so that <benefit>.
(Cover every part of the feature.)

## Implementation decisions
Modules built or changed, their interfaces, schema changes, API contracts and architectural decisions.

## Reuse first
Existing modules, helpers and dependencies to build on, by name and path.

## Seams
- <seam>: what it catches, what it misses.

## Out of scope
What was cut in the probe, so nobody builds it later.

## Open questions
Gaps the decisions do not cover. Empty when the spec is ready.
```

Leave code snippets out, as they go stale fast. The exception is a snippet from a prototype that pins a decision more precisely than prose can (a state machine, a schema or a type shape): inline only the decision-rich part and say it came from a prototype. Paths are allowed under **Reuse first**, as `yaaw-dev` needs them.
