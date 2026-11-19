---
name: yaaw-domain
description: Build and sharpen a project's domain model - GLOSSARY.md terms and ADRs. Preloaded into yaaw-planner. Use when discussing or settling project terminology, writing or editing GLOSSARY.md, or recording an ADR.
---

# yaaw-domain

Build and sharpen the project's domain model while designing: challenge terms, invent edge cases, and write the glossary and decisions down the moment they settle. Reading `GLOSSARY.md` for vocabulary is a habit every yaaw skill has. This skill is for changing the model.

## Files

Most repos have one context: a `GLOSSARY.md` at the root and ADRs in `docs/adr/`. A `GLOSSARY-MAP.md` at the root means several contexts, each with its own `GLOSSARY.md` and `docs/adr/`. Create these files only when there is something to write.

## While designing

- **Challenge against the glossary.** When a term conflicts with `GLOSSARY.md`, say so at once: "The glossary defines cancellation as X, but this seems to mean Y. Which is it?"
- **Sharpen fuzzy words.** Propose a precise term for a vague or overloaded one: "Account here means the Customer or the User? Those are different."
- **Try concrete scenarios.** Invent cases at the edges between concepts to make the boundaries precise.
- **Cross-check the code.** When a claim about how something works disagrees with the code, raise it.
- **Update GLOSSARY.md as terms settle**, one at a time, in the format in [GLOSSARY-FORMAT.md](GLOSSARY-FORMAT.md). The glossary holds definitions only, with no implementation details.
- **Record an ADR only when all 3 gates pass**: hard to reverse, surprising without context and the result of a real trade-off. The format is in [ADR-FORMAT.md](ADR-FORMAT.md).

As a subagent, record a term or ADR only when the decision is already settled in the feature's `DECISIONS.md`. A term that needs the user's choice goes in your report as an open question.
