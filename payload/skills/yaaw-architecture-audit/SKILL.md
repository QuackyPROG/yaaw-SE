---
name: yaaw-architecture-audit
description: Scan a codebase for deepening opportunities, show them as a visual HTML report, then probe the one the user picks.
disable-model-invocation: true
argument-hint: "Optional: a module, subsystem or pain point to focus on"
---

# yaaw-architecture-audit

Surface architectural friction and propose **deepening opportunities**: refactors that turn shallow modules into deep ones, for testability and AI-navigability. Use the `yaaw-architecture` vocabulary exactly (module, interface, depth, seam, adapter, leverage, locality) and the domain terms from `GLOSSARY.md`. ADRs in `docs/adr/` record decisions this audit does not re-argue.

## 1. Explore

**Scope before scanning.** When the user named a direction, take it. Otherwise, walk back through `git log --oneline` to find the hot spots, the files that keep changing, and look there first, as deepening pays off where code changes.

Then dispatch a subagent with a fresh context to walk the code and note friction:

- Understanding one concept means bouncing between many small modules.
- A module is **shallow**: its interface is nearly as complex as its implementation.
- Pure functions were extracted only for testing, but the bugs hide in how they are called.
- Tightly coupled modules leak across their seams.
- Parts of the code are untested or hard to test through their interface.

Apply the **deletion test** to every suspect: would deleting it concentrate complexity, or only move it?

## 2. Report

Write a self-contained HTML file to the OS temp folder (`%TEMP%` on Windows, otherwise `$TMPDIR` or `/tmp`) as `architecture-audit-<timestamp>.html`, open it, and give the user its absolute path. Nothing lands in the repo. The scaffold, diagram patterns and styling are in [HTML-REPORT.md](HTML-REPORT.md).

Each candidate gets a card with its files, the problem, the solution in plain English, the benefits in terms of locality, leverage and tests, a before and after diagram, and a strength badge: `Strong`, `Worth exploring` or `Speculative`. A candidate that contradicts an ADR appears only when the friction is worth reopening it, with a warning that names the ADR. End with a **Top recommendation**.

Propose no interfaces yet. Ask: "Which of these would you like to explore?"

## 3. Probe the pick

Run `yaaw-probe` on the chosen candidate: its constraints, its dependencies, the shape of the deepened module, what sits behind the seam and which tests survive. Use `yaaw-domain` to update `GLOSSARY.md` and record ADRs as decisions settle. To compare alternative interfaces, use the design-it-twice pattern in `yaaw-architecture`.

When the user wants it built, the settled decisions become a feature for `/yaaw-se`.
