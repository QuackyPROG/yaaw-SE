---
name: yaaw-pr
description: Write a pull request body with a visual summary, before-and-after evidence and the merge danger. Use when opening a PR or writing a PR description.
---

# yaaw-pr

Write the PR body with this template. Skip preambles, keep prose brief and use the domain language from `GLOSSARY.md`.

```markdown
## Summary

<diagram, diff sketch or tree>

## Evidence

- **Before:** <screenshot, output or failing test run>
  **After:** <screenshot, output or passing test run>

## Merge danger

**Door:** <one-way or two-way>

**Blast radius:** <one word>

<optional: what could break once merged>
```

## Summary

Pick the smallest view that makes the main point clear, and put each visual next to the short text it supports:

- **Pseudocode** for logic or an algorithm.
- **A call tree** for runtime control flow.
- **A component tree** for UI structure, with the state and module boundaries that matter.
- **A shallow file tree** for a broad refactor or file responsibilities.
- **Mermaid** for interaction, control flow or data flow between parts.
- **A `diff` block** when the point is what changed in a shape that already exists: a component tree, file layout, call tree or control flow with `+` and `-` lines.
- **The whole code block** only when most of it is new or the reader needs the exact target shape.

Usually 1 or 2 of these are enough. Keep only the calls, files, props and states the reader needs.

## Evidence

Show that the change works, before and after. A screenshot is best for a visual change. Test results or console output come next: show the test that failed before and passes now.

## Merge danger

A **two-way door** can be walked back cheaply. A **one-way door** cannot: destructive actions, data migrations and other hard-to-reverse changes. The **blast radius** is what the change could affect: layout shift, broken consumers, mobile layout and so on.
