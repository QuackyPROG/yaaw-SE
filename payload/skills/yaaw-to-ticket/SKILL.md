---
name: yaaw-to-ticket
description: Break a spec into tracer-bullet tickets with blocking edges, seams, a reuse-first line and acceptance criteria, ready for yaaw-dev. Preloaded into yaaw-planner. Use when a spec is ready to be split into tickets.
---

# yaaw-to-ticket

Break a spec into **tickets**: tracer-bullet vertical slices, each declaring the tickets that **block** it. A ticket is written for `yaaw-dev`, which works without asking questions. Everything it needs is in the ticket.

## Process

1. **Read** `docs/yaaw-se/<slug>/SPEC.md` and the code it touches. When the spec still has **Open questions**, stop and report them.
2. **Prefactor first.** Look for a change that makes the feature easy to add ("make the change easy, then make the easy change"). It becomes the first ticket.
3. **Draft vertical slices.**
   - Each slice cuts a narrow but complete path through every layer (schema, API, UI and tests).
   - A finished slice can be demoed or verified on its own.
   - Each slice fits in one fresh context window.
4. **Give each ticket its blocking edges**: the tickets that must finish before it can start.
5. **Fill every field** of the template below. A ticket with an empty field is not ready.
6. **Write** one file per ticket at `docs/yaaw-se/<slug>/tickets/NN-<slug>.md`, numbered from `01` in dependency order.

## Wide refactors

A **wide refactor** is one mechanical change (rename a column, retype a shared symbol) that breaks call sites across the whole codebase at once, so no vertical slice can land green. Sequence it as **expand and contract**: add the new form beside the old, migrate the call sites in batches (one ticket per batch, each blocked by the expand), then delete the old form in a ticket blocked by every batch.

## Template

```markdown
# NN: <Ticket title>

**Status:** ready
**Agent:** yaaw-dev | yaaw-designer
**Blocked by:** <ticket numbers>, or None

## What to build
The end-to-end behaviour this ticket makes work, from the user's point of view.

## Design direction
Mode, look (inherit, extend or new, with the details), what must not change and what success looks like, from DECISIONS.md. None for a yaaw-dev ticket.

## Seams
- <seam>: the behaviour each test proves there.

## Reuse first
- <existing module, helper, component or dependency, with its path>

## Acceptance criteria
- [ ] <checkable criterion>

## Not in this ticket
<nearby work that belongs to another ticket or is out of scope>
```

`Agent` is `yaaw-designer` when the ticket's main work is UI or UX, and `yaaw-dev` otherwise. A `yaaw-designer` ticket's **Design direction** comes from DECISIONS.md only. When the decisions do not settle it, add it to the spec's **Open questions**.

## Done

Every ticket has all fields filled, every blocking edge points at a real ticket, and every user story in the spec is covered by at least 1 ticket. Report the list as `NN: title (blocked by …)`.
