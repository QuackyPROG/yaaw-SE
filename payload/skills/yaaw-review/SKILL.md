---
name: yaaw-review
description: Review a change on two axes, Spec (does it do what the ticket or spec asked) and Quality (correct, safe, holds under load, tested, fast, lean), reading the connected code and not only the diff. Preloaded into yaaw-reviewer. Use for "review this", a code review, or reviewing a branch, commit or PR.
---

# yaaw-review

Review a change like the senior developer who gets paged when it breaks. Read the code the change touches, not only the diff. List findings and change no code.

## 1. Pin the change

Review what was named: a ticket's commit range, uncommitted changes, a branch, a PR or files. With nothing named, review the uncommitted changes, or the last commit when there are none. Confirm the range resolves and the diff is not empty before going further.

## 2. Find the spec

Look in this order: the ticket file under `docs/yaaw-se/<slug>/tickets/`, the feature's `SPEC.md`, issue references in the commit messages, a path that was passed in. With no spec, skip the Spec axis and say so.

## 3. Understand the change

- Read the diff, then the callers of every changed function, the functions it calls and the tests.
- Trace the real flow: where data comes in, what is stored, what goes out.
- When a signature, return value or behaviour changes, grep every caller. A change can break code it does not touch.
- Find the expected load in the repo (README, deploy config), judge scale against it, and say which load you assumed.
- Read the project's coding standards (`CONTRIBUTING.md`, `CODING_STANDARDS.md`, lint config). A documented standard always wins over the checks below.

## 4. Spec axis

- Acceptance criteria that are missing or only partly done.
- Behaviour in the diff that was not asked for (scope creep).
- Changed lines that do not trace to the ticket: reformatting, renames or refactors of nearby code.
- Criteria that look done but are done wrong.

Quote the ticket or spec line for each finding.

## 5. Quality axis

In order of importance:

1. **Bug**: wrong result, crash, missed edge case (empty, zero, last item, rounding, time zones), a caller broken by the change, a fix applied in one caller while the shared function stays broken.
2. **Risk**: security holes (injection, weak randomness, secrets, unchecked user input) and data loss (swallowed errors, writes in the wrong order, no transaction).
3. **Scale**: check-then-write races, a query per item, lists that only grow, O(n²) on big input, per-process state that must be shared.
4. **Missing test**: a seam named in the ticket without a test that fails when it breaks, or risky new logic with no test.
5. **Speed**: big slowdowns are problems, and small wins are suggestions.
6. **Lean**: code that should not exist or should be smaller.
   - delete: dead code the diff creates, unused options, speculative features. Dead code that was already there is a note, not a finding.
   - reuse: the repo already has this helper (name the path)
   - stdlib or native: the platform already does it, or a new dependency for a few lines
   - yagni: an abstraction with one adapter, config nobody sets
   - merge: near-copies that must change together
   - split: one function doing unrelated jobs (split by job, never by line count)
   - naming: a name that does not say what the thing does or holds

## 6. Check before you report

- Every finding needs a concrete case: "this input leads to this wrong result". No case, no finding.
- Re-read the lines and confirm: the caller exists, the value can be empty, the code is unused.
- A `shortcut:` comment that names its limit is a decision, not a finding, unless the expected load already crosses it.
- Propose the smallest fix that works, preferring fixes that delete code.
- Leave out style taste and vague worries.

## 7. Output

Plain English in short sentences. Explain a technical term the first time it is used.

Start with `What this change does:` in 2 or 3 sentences. Then report the two axes under `## Spec` and `## Quality`, separately, so one cannot mask the other. Within each, group findings as **Must fix** (bugs, security, data loss, a missed criterion), **Should fix** and **Nice to have**, and skip empty groups. Number findings across the whole report so the user can say "fix 2 and 5".

Each finding has 4 parts, each 1 or 2 short sentences:

```
2. **Orders land on the wrong day** (`billing/close_day.py:40-52`)
   - **What this is:** At midnight this job closes the day and bills all its orders.
   - **Problem:** It takes "today" from the server clock in UTC, so an order at 00:30 in Berlin is billed the day before.
   - **Fix:** Compute the day once in the shop's time zone. One line.
   - **If we skip it:** Late orders show the wrong date and are fixed by hand.
```

End with:

- `Verdict: Ship.` or `Verdict: fix 1 and 3 first.`
- `Lean: -<N> lines possible.` when there are lean findings.
- `Not checked:` one line, when something mattered and could not be checked.

With nothing found: `What this change does:`, then `Looks good. Ship.` and one line on what was checked.
