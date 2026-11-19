---
name: yaaw-probe-docs
description: Probe a plan grounded in the project's own records (glossary, ADRs, earlier specs), recording the decisions that matter as ADRs while they settle.
disable-model-invocation: true
argument-hint: "The plan, feature or design to probe"
---

# yaaw-probe-docs

A `yaaw-probe` interview that starts from what the project already records and leaves a paper trail. Plain `yaaw-probe` keeps everything in the conversation. This one reads the project's records first and writes the decisions that matter back into them.

## 1. Ground

Before the first round, read:

- `GLOSSARY.md` (or `GLOSSARY-MAP.md` and the glossaries it points to),
- the ADRs in `docs/adr/` that touch the subject,
- earlier specs and decisions under `docs/yaaw-se/` that touch the subject,
- the `README.md` and `CLAUDE.md` or `AGENTS.md` of the project.

Grounding is done when the project's current position on the subject can be stated in 3 to 5 lines. Show those lines to the user above the first round.

## 2. Probe

Run the `yaaw-probe` rounds. While they run:

- **Challenge against the record.** When an answer conflicts with an ADR or the glossary, quote it and ask which one stands: "ADR-0003 says X, but this answer says Y. Which one stands?"
- **Check claims against the code.** When the user states how something works, check it. Raise a mismatch as its own question.
- **Sharpen fuzzy words.** When the user uses a vague or overloaded word, propose the glossary's precise term and use it from then on (see `yaaw-domain`).
- **Try concrete scenarios.** Make up a specific case at the edge of a decision and ask what happens in it.

## 3. Record as you go

A decision becomes an ADR the moment it settles, when it passes all 3 gates:

1. **Hard to reverse**: changing it later costs real work.
2. **Surprising without context**: a future reader would ask "why this way?".
3. **A real trade-off**: there were genuine alternatives, and one was picked for a reason.

Use the ADR format in `yaaw-domain`. A decision that misses a gate stays in the conversation and in the feature's `DECISIONS.md`. Tell the user each time an ADR is written.

## Done

The `yaaw-probe` frontier is empty, every 3-gate decision has an ADR, and the user has confirmed the shared understanding.
