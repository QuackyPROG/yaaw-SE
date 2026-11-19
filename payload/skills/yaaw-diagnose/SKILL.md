---
name: yaaw-diagnose
description: Diagnosis loop for a bug - build a red check, minimise, hypothesise, probe, fix and clean up. Preloaded into yaaw-dev. Use when a test fails for an unknown reason, a bug is reported, or behaviour differs from what was expected.
---

# yaaw-diagnose

A discipline for bugs. Skip a phase only when you can say why.

Write `<REDACTED>` in place of every secret, token, key or personal detail before showing a command, log or config.

## Phase 1: Build a red check

**This is the skill.** With a check that goes **red** on the bug, the cause will be found. Without one, reading code only produces theories. Spend most of the effort here.

Ways to build one, roughly in this order:

1. **A failing test** at the nearest seam that shows the symptom.
2. **A script or command** that reproduces it: a curl call, a CLI run, a small script that calls the function.
3. **Logs or a trace** from the failing run, with the exact input.
4. **Ask the user** to reproduce it, as a last resort for UI-only behaviour. Give the exact steps and the exact thing to report back. A subagent lists this under **Blocked** in its report instead.

Phase 1 is done when you can name **one command** that you have already run (show it and its output), and it is:

- **Red-capable**: it shows the exact symptom and would turn green once fixed.
- **Repeatable**: same verdict every run.
- **Fast**: seconds, not minutes.

No red check, no Phase 2. When one cannot be built, say what was tried and what is needed.

## Phase 2: Reproduce and minimise

Run the check and watch it go red. Confirm it is the reported symptom, not a nearby one. Then cut input, config and code paths one at a time, rerunning after each cut, until every remaining piece is needed for the bug.

## Phase 3: Hypothesise

Write 3 to 5 ranked hypotheses, each with the prediction it makes: "If X is the cause, changing Y will make the check go green." In the main session, show the list to the user before testing, as they may already know which one it is.

## Phase 4: Probe

Each probe tests one prediction and changes one thing. Check the current docs before trusting a remembered API, flag or config key.

## Phase 5: Fix

Grep every caller of the code at fault, then fix the root cause once in the shared code, following `yaaw-lean`. Keep the red check as a regression test when it is a test. Rerun it and show it green, then run the full suite.

## Phase 6: Clean up

Every temporary file, debug log and test script that is not a kept regression test is removed, and every cut from Phase 2 is restored.
