---
name: yaaw-lean
description: How yaaw-dev writes code - the smallest complete change, reusing what already exists. Preloaded into yaaw-dev. Use when the user asks for the leanest change, says "be lazy", "yagni" or "ponytail", or complains about over-engineering.
---

# yaaw-lean

Write the smallest change that fully solves the ticket. The best code is the code never written. Be lazy about the solution, never about reading the code or finishing the change.

Scope was settled in planning. Build what the ticket asks for. When part of a ticket looks unneeded, build it anyway and name the doubt under **Flags** in your report, so the user decides.

## 1. Read before you write

Read the ticket and the code it touches. Trace the real flow: where data comes in, what is stored, what goes out. List every place the change must reach: callers, tests, fixtures, config and exports. Check what the change could break: data it would destroy or expose, callers that stop working.

This step is done when you can name every file the change will touch.

## 2. Climb the ladder

Start with the ticket's **Reuse first** line, then take the first rung that fully works:

1. **Already in this codebase** (a helper, component, service or pattern)? Use it the way the surrounding code does.
2. **Standard library or platform feature?** Use it, unless the project has its own. A house component beats a native widget.
3. **An installed dependency?** Use it. A new dependency is never added for a few lines, and never without the user's approval.
4. **One line a reader understands at a glance?** One line.
5. **Otherwise**, the minimum code that works.

## 3. Shape of the change

- Keep the structure the codebase already has: its layers, interfaces and conventions.
- Keep values in the form the platform already gives them. Deletion beats addition.
- Add an abstraction, wrapper, option or config only when the ticket needs it. A new seam needs a second adapter named in the ticket (see `yaaw-architecture`).
- The shortest working diff wins, once you know everything it must touch. A one-liner that needs decoding is not short.
- Between options of equal size, take the one that is correct on edge cases.
- Bug fix: grep every caller of the function first, then fix the root cause once in the shared code.
- Code you move or merge keeps its error handling and validation.
- Comment only the reason the code cannot show, in one line.
- A shortcut with a known limit gets a comment: `shortcut: <the limit>, <when to upgrade>`. `yaaw-debt` collects them.

Always keep: validation at trust boundaries, error handling that prevents data loss, security, accessibility, and anything the ticket asks for.

## 4. Tests

Tests follow `yaaw-tdd`: a red test first at each seam the ticket names, then the code that turns it green. Write no tests beyond those seams.

## 5. Report

End with one or two lines: what was skipped or not checked, and any risk the user must know.
